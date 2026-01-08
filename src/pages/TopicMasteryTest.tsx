import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, ClipboardCheck, ChevronLeft, ChevronRight, Send, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MathRenderer from "@/components/MathRenderer";
import { MasteryTestQuestion as QuestionComponent } from "@/components/mastery-test/MasteryTestQuestion";
import { MasteryTestResults } from "@/components/mastery-test/MasteryTestResults";
import { TheorySidebar } from "@/components/mastery-test/TheorySidebar";
import type { MasteryTestQuestion, MasteryTestAnswer, MasteryTestResult, TheoryBlockForTest } from "@/types/topicMasteryTest";
import { toast } from "sonner";

type TestPhase = 'intro' | 'test' | 'results';

export default function TopicMasteryTest() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [phase, setPhase] = useState<TestPhase>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState<{ id: string; name: string } | null>(null);
  const [questions, setQuestions] = useState<MasteryTestQuestion[]>([]);
  const [answers, setAnswers] = useState<MasteryTestAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [results, setResults] = useState<MasteryTestResult | null>(null);
  const [theoryBlocks, setTheoryBlocks] = useState<TheoryBlockForTest[]>([]);
  const [isTheorySidebarOpen, setIsTheorySidebarOpen] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Fetch topic info
  useEffect(() => {
    if (!topicId) return;
    
    const fetchTopic = async () => {
      const { data } = await supabase
        .from("topics")
        .select("id, name")
        .eq("id", topicId)
        .single();
      
      if (data) setTopic(data);
    };
    
    fetchTopic();
  }, [topicId]);

  // Fetch theory blocks for sidebar
  useEffect(() => {
    if (!topicId) return;
    
    const fetchTheoryBlocks = async () => {
      const { data } = await supabase
        .from("theory_blocks")
        .select("id, block_number, block_type, title, content, latex_content")
        .eq("topic_id", topicId)
        .order("order_index");
      
      if (data) {
        setTheoryBlocks(data.map(b => ({
          id: b.id,
          blockNumber: b.block_number || '',
          blockType: b.block_type,
          title: b.title,
          content: b.content as Record<string, unknown>,
          latexContent: b.latex_content || undefined
        })));
      }
    };
    
    fetchTheoryBlocks();
  }, [topicId]);

  // Track elapsed time
  useEffect(() => {
    if (phase !== 'test' || !startTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 60000);
      setElapsedMinutes(diff);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [phase, startTime]);

  const handleStartTest = async () => {
    setIsLoading(true);
    
    try {
      // Generate test questions
      const { data, error } = await supabase.functions.invoke('generate-topic-mastery-test', {
        body: { topicId, questionCount: 8 }
      });
      
      if (error) throw error;
      if (!data?.questions || data.questions.length === 0) {
        throw new Error("No questions generated. This topic may lack theory blocks.");
      }
      
      // Create test record in database
      if (user) {
        const { data: testRecord, error: insertError } = await supabase
          .from("topic_mastery_tests")
          .insert({
            user_id: user.id,
            topic_id: topicId,
            status: 'in_progress',
            questions: data.questions,
            answers: []
          })
          .select()
          .single();
        
        if (!insertError && testRecord) {
          setTestId(testRecord.id);
        }
      }
      
      setQuestions(data.questions);
      setAnswers(data.questions.map((q: MasteryTestQuestion) => ({
        questionId: q.id,
        userAnswer: ''
      })));
      setStartTime(new Date());
      setPhase('test');
      
    } catch (err: any) {
      console.error("Failed to generate test:", err);
      toast.error(err?.message || "Failed to generate test");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => prev.map(a => 
      a.questionId === questionId ? { ...a, userAnswer: answer } : a
    ));
  };

  const handleSubmitTest = async () => {
    if (!startTime) return;
    
    setIsLoading(true);
    const endTime = new Date();
    const timeSpentMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / 60000);
    
    try {
      // Grade the test
      const { data, error } = await supabase.functions.invoke('grade-mastery-test', {
        body: {
          testId,
          topicId,
          questions,
          answers,
          timeSpentMinutes
        }
      });
      
      if (error) throw error;
      
      setResults({
        overallPercentage: data.overallPercentage,
        totalQuestions: data.totalQuestions,
        correctCount: data.correctCount,
        timeSpentMinutes,
        theoryBlockScores: data.theoryBlockScores,
        weakBlocks: data.theoryBlockScores.filter((b: any) => b.status !== 'strong'),
        strongBlocks: data.theoryBlockScores.filter((b: any) => b.status === 'strong'),
        subtopicBreakdown: data.subtopicCoverage
      });
      
      // Update test record
      if (testId && user) {
        await supabase
          .from("topic_mastery_tests")
          .update({
            status: 'completed',
            completed_at: endTime.toISOString(),
            time_spent_minutes: timeSpentMinutes,
            answers: data.gradedAnswers
          })
          .eq("id", testId);
        
        // Save results
        await supabase
          .from("topic_mastery_results")
          .insert({
            user_id: user.id,
            topic_id: topicId,
            test_id: testId,
            total_questions: data.totalQuestions,
            correct_count: data.correctCount,
            overall_percentage: data.overallPercentage,
            time_spent_minutes: timeSpentMinutes,
            theory_block_scores: data.theoryBlockScores,
            weak_blocks: data.weakBlocks,
            strong_blocks: data.strongBlocks,
            subtopic_coverage: data.subtopicCoverage
          });
      }
      
      setPhase('results');
      
    } catch (err: any) {
      console.error("Failed to grade test:", err);
      toast.error(err?.message || "Failed to submit test");
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Intro Phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/learning-path/${topicId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Topic Review Test</h1>
          </div>
        </header>
        
        <main className="container max-w-2xl py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Cumulative Topic Review</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Assess your understanding across all areas of <strong>{topic?.name || 'this topic'}</strong>
              </p>
            </div>
            
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  About This Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">1</span>
                    </div>
                    <span>This test covers <strong>all subtopics</strong> in {topic?.name}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">2</span>
                    </div>
                    <span>You can <strong>access theory references</strong> at any time during the test</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">3</span>
                    </div>
                    <span>Results will <strong>highlight areas for review</strong> with direct links to theory</span>
                  </li>
                </ul>
                
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    This is a self-assessment tool to help you identify areas for further study. 
                    Take your time and use the theory reference when needed.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              className="w-full h-12" 
              onClick={handleStartTest}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Preparing Questions...
                </>
              ) : (
                'Begin Review Test'
              )}
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Test Phase
  if (phase === 'test') {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{topic?.name}</span>
              <span className="text-xs text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {elapsedMinutes > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{elapsedMinutes} min</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTheorySidebarOpen(!isTheorySidebarOpen)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Theory Reference
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-1" />
        </header>
        
        <div className="flex">
          {/* Main content */}
          <main className={`flex-1 container max-w-3xl py-8 transition-all ${isTheorySidebarOpen ? 'mr-80' : ''}`}>
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <QuestionComponent
                  key={currentQuestion.id}
                  question={currentQuestion}
                  answer={answers.find(a => a.questionId === currentQuestion.id)?.userAnswer || ''}
                  onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                  questionNumber={currentIndex + 1}
                  totalQuestions={questions.length}
                  onOpenTheory={() => setIsTheorySidebarOpen(true)}
                />
              )}
            </AnimatePresence>
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {currentIndex === questions.length - 1 ? (
                <Button 
                  onClick={handleSubmitTest}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={() => setCurrentIndex(prev => prev + 1)}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </main>
          
          {/* Theory Sidebar */}
          <TheorySidebar
            isOpen={isTheorySidebarOpen}
            onClose={() => setIsTheorySidebarOpen(false)}
            theoryBlocks={theoryBlocks}
            highlightedBlockNumbers={currentQuestion?.conceptsTested}
          />
        </div>
      </div>
    );
  }

  // Results Phase
  if (phase === 'results' && results) {
    return (
      <MasteryTestResults
        topicId={topicId || ''}
        topicName={topic?.name || ''}
        results={results}
        questions={questions}
        answers={answers}
        onBackToPath={() => navigate(`/learning-path/${topicId}`)}
      />
    );
  }

  return null;
}
