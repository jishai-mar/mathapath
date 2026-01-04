import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Brain, 
  GraduationCap, 
  FileText, 
  Target,
  BookOpen,
  Lightbulb,
  CheckCircle,
  XCircle,
  BarChart3,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ExponentialTutorChat } from '@/components/tutor/ExponentialTutorChat';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { 
  EXPONENTIAL_CURRICULUM, 
  STUDENT_PROFILES,
  getLearningPath,
  assessReadiness 
} from '@/data/exponentialCurriculum';

interface ExamQuestion {
  id: string;
  number: number;
  problem: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  solution: string;
  solutionSteps: string[];
  skillTested: string;
}

interface ExamData {
  examTitle: string;
  totalPoints: number;
  timeMinutes: number;
  questions: ExamQuestion[];
  instructions: string;
}

interface ExamAnswer {
  questionId: string;
  answer: string;
  correct: boolean;
  difficulty: string;
}

interface ReadinessResult {
  readinessLevel: 'not-ready' | 'almost-ready' | 'ready';
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextSteps: string;
  encouragement: string;
}

export default function ExponentialTutorDemo() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('curriculum');
  const [learningStyle, setLearningStyle] = useState<'formal' | 'intuitive'>('formal');
  
  // Practice tracking
  const [problemsAttempted, setProblemsAttempted] = useState(0);
  const [problemsCorrect, setProblemsCorrect] = useState(0);
  const [performanceByDifficulty, setPerformanceByDifficulty] = useState<Record<string, { correct: number; total: number }>>({
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 }
  });
  
  // Exam state
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResults, setExamResults] = useState<ExamAnswer[]>([]);
  const [readinessResult, setReadinessResult] = useState<ReadinessResult | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  const handleProblemComplete = useCallback((correct: boolean, difficulty: string) => {
    setProblemsAttempted(prev => prev + 1);
    if (correct) setProblemsCorrect(prev => prev + 1);
    
    setPerformanceByDifficulty(prev => ({
      ...prev,
      [difficulty]: {
        correct: prev[difficulty].correct + (correct ? 1 : 0),
        total: prev[difficulty].total + 1
      }
    }));
  }, []);

  const generateExam = async () => {
    setIsGeneratingExam(true);
    try {
      const { data, error } = await supabase.functions.invoke('exponential-tutor', {
        body: { action: 'generate-exam', learningStyle }
      });

      if (error) throw error;
      
      if (data?.success && data?.result) {
        setExam(data.result);
        setExamAnswers({});
        setExamSubmitted(false);
        setExamResults([]);
        setReadinessResult(null);
        toast.success('Practice exam generated!');
      }
    } catch (err) {
      console.error('Error generating exam:', err);
      toast.error('Failed to generate exam');
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const submitExam = async () => {
    if (!exam) return;
    
    // Check answers (simple string matching for demo)
    const results: ExamAnswer[] = exam.questions.map(q => {
      const userAnswer = examAnswers[q.id]?.toLowerCase().trim() || '';
      const correctAnswer = q.solution.toLowerCase().trim();
      
      // Flexible answer matching
      const isCorrect = 
        userAnswer === correctAnswer ||
        userAnswer.includes(correctAnswer.replace('x = ', '')) ||
        correctAnswer.includes(userAnswer.replace('x = ', ''));
      
      return {
        questionId: q.id,
        answer: examAnswers[q.id] || '',
        correct: isCorrect,
        difficulty: q.difficulty
      };
    });
    
    setExamResults(results);
    setExamSubmitted(true);
    
    // Get AI readiness assessment
    setIsAssessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('exponential-tutor', {
        body: { 
          action: 'assess-readiness',
          examAnswers: results,
          learningStyle
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.result) {
        setReadinessResult(data.result);
      }
    } catch (err) {
      console.error('Error assessing readiness:', err);
      // Fallback assessment
      const correctCount = results.filter(r => r.correct).length;
      const percentage = (correctCount / results.length) * 100;
      setReadinessResult({
        readinessLevel: percentage >= 80 ? 'ready' : percentage >= 60 ? 'almost-ready' : 'not-ready',
        overallScore: percentage,
        summary: `You answered ${correctCount} out of ${results.length} questions correctly.`,
        strengths: [],
        weaknesses: [],
        recommendations: ['Continue practicing exponential equations'],
        nextSteps: 'Review your incorrect answers and try again.',
        encouragement: 'Keep practicing!'
      });
    } finally {
      setIsAssessing(false);
    }
  };

  const learningPath = getLearningPath('exponential-equations');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Exponential Equations AI Tutor
              </h1>
              <p className="text-sm text-muted-foreground">PoC Demo - Pre-university Mathematics</p>
            </div>
          </div>
          
          {/* Learning Style Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Learning Style:</span>
            <RadioGroup 
              value={learningStyle} 
              onValueChange={(v) => setLearningStyle(v as 'formal' | 'intuitive')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="formal" id="formal" />
                <Label htmlFor="formal" className="cursor-pointer">Formal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intuitive" id="intuitive" />
                <Label htmlFor="intuitive" className="cursor-pointer">Intuitive</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="curriculum" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="tutor" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Interactive Tutor
            </TabsTrigger>
            <TabsTrigger value="exam" className="gap-2">
              <FileText className="h-4 w-4" />
              Practice Exam
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Learning Path to Exponential Equations
                  </CardTitle>
                  <CardDescription>
                    The curriculum is structured with clear prerequisites. Master each topic before moving to the next.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {learningPath.map((topic, idx) => (
                      <div key={topic.id} className="flex items-start gap-4">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          topic.id === 'exponential-equations' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{topic.name}</h3>
                            {topic.id === 'exponential-equations' && (
                              <Badge>Main Topic</Badge>
                            )}
                            {topic.prerequisites.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Requires: {topic.prerequisites.join(', ')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                          
                          {/* Learning Objectives */}
                          <div className="mt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Learning Objectives:</p>
                            <ul className="text-sm space-y-1">
                              {topic.learningObjectives.slice(0, 3).map(obj => (
                                <li key={obj.id} className="flex items-start gap-2">
                                  <Lightbulb className="h-3 w-3 mt-1 text-yellow-500" />
                                  <span>{obj.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Common Mistakes for main topic */}
                          {topic.id === 'exponential-equations' && (
                            <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                              <p className="text-xs font-medium text-destructive mb-1">Common Mistakes to Avoid:</p>
                              <ul className="text-sm space-y-1">
                                {topic.commonMistakes.map((mistake, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <XCircle className="h-3 w-3 mt-1 text-destructive" />
                                    <span>{mistake}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Mastery Definition */}
                  <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Mastery Definition
                    </h4>
                    <p className="text-sm mt-1">
                      {EXPONENTIAL_CURRICULUM.find(t => t.id === 'exponential-equations')?.masteryDescription}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Interactive Tutor Tab */}
          <TabsContent value="tutor">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ExponentialTutorChat 
                  learningStyle={learningStyle}
                  onProblemComplete={handleProblemComplete}
                />
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Session Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Problems Attempted</span>
                        <span className="font-mono">{problemsAttempted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Correct Answers</span>
                        <span className="font-mono text-green-500">{problemsCorrect}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Accuracy</span>
                        <span className="font-mono">
                          {problemsAttempted > 0 
                            ? `${Math.round((problemsCorrect / problemsAttempted) * 100)}%`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Learning Style: {STUDENT_PROFILES[learningStyle].name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {STUDENT_PROFILES[learningStyle].description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Practice Exam Tab */}
          <TabsContent value="exam">
            {!exam ? (
              <Card className="max-w-2xl mx-auto text-center">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <FileText className="h-6 w-6" />
                    Generate Practice Exam
                  </CardTitle>
                  <CardDescription>
                    Take a timed practice exam focused on exponential equations.
                    Includes 6 questions: 2 easy, 2 medium, 2 hard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="lg" 
                    onClick={generateExam}
                    disabled={isGeneratingExam}
                  >
                    {isGeneratingExam ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Exam...
                      </>
                    ) : (
                      'Start Practice Exam'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : examSubmitted ? (
              <div className="space-y-6">
                {/* Results Summary */}
                <Card className={`border-2 ${
                  readinessResult?.readinessLevel === 'ready' ? 'border-green-500' :
                  readinessResult?.readinessLevel === 'almost-ready' ? 'border-yellow-500' :
                  'border-red-500'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {readinessResult?.readinessLevel === 'ready' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : readinessResult?.readinessLevel === 'almost-ready' ? (
                        <Target className="h-6 w-6 text-yellow-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                      Exam Results & Readiness Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isAssessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing your performance...</span>
                      </div>
                    ) : readinessResult && (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="text-4xl font-bold">
                            {readinessResult.overallScore.toFixed(0)}%
                          </div>
                          <Badge className={`text-lg px-3 py-1 ${
                            readinessResult.readinessLevel === 'ready' ? 'bg-green-500' :
                            readinessResult.readinessLevel === 'almost-ready' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}>
                            {readinessResult.readinessLevel === 'ready' ? 'Ready for Exam!' :
                             readinessResult.readinessLevel === 'almost-ready' ? 'Almost Ready' :
                             'More Practice Needed'}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground">{readinessResult.summary}</p>
                        
                        {readinessResult.strengths.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-600">Strengths:</h4>
                            <ul className="list-disc list-inside text-sm">
                              {readinessResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                        
                        {readinessResult.weaknesses.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-red-600">Areas to Improve:</h4>
                            <ul className="list-disc list-inside text-sm">
                              {readinessResult.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                          </div>
                        )}
                        
                        <div className="p-3 rounded-lg bg-primary/10">
                          <p className="text-sm font-medium">{readinessResult.nextSteps}</p>
                        </div>
                        
                        <p className="text-sm italic">{readinessResult.encouragement}</p>
                      </>
                    )}
                    
                    <Button onClick={generateExam} className="w-full">
                      Take Another Exam
                    </Button>
                  </CardContent>
                </Card>

                {/* Detailed Results */}
                <Card>
                  <CardHeader>
                    <CardTitle>Question-by-Question Review</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {exam.questions.map((q, idx) => {
                      const result = examResults.find(r => r.questionId === q.id);
                      return (
                        <div key={q.id} className={`p-4 rounded-lg border ${
                          result?.correct ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {result?.correct ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              <span className="font-semibold">Question {q.number}</span>
                              <Badge variant="outline" className="capitalize">{q.difficulty}</Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">{q.points} pts</span>
                          </div>
                          
                          <div className="mb-2">
                            <MathRenderer segments={createSegmentsFromSolution(`Solve: $${q.problem}$`)} />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Your answer: </span>
                              <span className={result?.correct ? 'text-green-600' : 'text-red-600'}>
                                {examAnswers[q.id] || '(no answer)'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Correct: </span>
                              <span className="text-green-600">{q.solution}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{exam.examTitle}</CardTitle>
                      <Badge variant="secondary">
                        {exam.totalPoints} points • {exam.timeMinutes} minutes
                      </Badge>
                    </div>
                    <CardDescription>{exam.instructions}</CardDescription>
                  </CardHeader>
                </Card>
                
                <ScrollArea className="h-[500px]">
                  <div className="space-y-6 pr-4">
                    {exam.questions.map((q) => (
                      <Card key={q.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Question {q.number}</span>
                              <Badge variant="outline" className="capitalize">{q.difficulty}</Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">{q.points} points</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="p-3 rounded-lg bg-muted">
                            <MathRenderer segments={createSegmentsFromSolution(`Solve: $${q.problem}$`)} />
                          </div>
                          <div>
                            <Label htmlFor={q.id}>Your Answer:</Label>
                            <Input
                              id={q.id}
                              value={examAnswers[q.id] || ''}
                              onChange={(e) => setExamAnswers(prev => ({
                                ...prev,
                                [q.id]: e.target.value
                              }))}
                              placeholder="e.g., x = 3"
                              className="mt-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                
                <Button size="lg" onClick={submitExam} className="w-full">
                  Submit Exam for Grading
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accuracy Rate</span>
                      <span>
                        {problemsAttempted > 0 
                          ? `${Math.round((problemsCorrect / problemsAttempted) * 100)}%`
                          : '—'}
                      </span>
                    </div>
                    <Progress 
                      value={problemsAttempted > 0 ? (problemsCorrect / problemsAttempted) * 100 : 0} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{problemsAttempted}</div>
                      <div className="text-xs text-muted-foreground">Problems Attempted</div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <div className="text-2xl font-bold text-green-600">{problemsCorrect}</div>
                      <div className="text-xs text-muted-foreground">Correct Answers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Difficulty</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(['easy', 'medium', 'hard'] as const).map(diff => {
                    const stats = performanceByDifficulty[diff];
                    const percent = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                    return (
                      <div key={diff}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{diff}</span>
                          <span>{stats.correct}/{stats.total}</span>
                        </div>
                        <Progress value={percent} className={
                          diff === 'easy' ? '[&>div]:bg-green-500' :
                          diff === 'medium' ? '[&>div]:bg-yellow-500' :
                          '[&>div]:bg-red-500'
                        } />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Quick Readiness Check</CardTitle>
                </CardHeader>
                <CardContent>
                  {problemsAttempted >= 3 ? (
                    (() => {
                      const result = assessReadiness(
                        problemsCorrect, 
                        problemsAttempted, 
                        performanceByDifficulty
                      );
                      return (
                        <div className={`p-4 rounded-lg ${
                          result.level.level === 'ready' ? 'bg-green-500/10 border border-green-500/30' :
                          result.level.level === 'almost-ready' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                          'bg-red-500/10 border border-red-500/30'
                        }`}>
                          <h3 className="font-semibold text-lg mb-2">{result.level.description}</h3>
                          <p className="text-sm">{result.specificFeedback}</p>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-muted-foreground">
                      Complete at least 3 practice problems to see your readiness assessment.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
