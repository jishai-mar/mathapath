import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, Target, AlertTriangle, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import MathRenderer from "@/components/MathRenderer";
import { motion, AnimatePresence } from "framer-motion";

interface ExamPart {
  partLabel: string;
  question: string;
  points: number;
  solution: string;
  answer: string;
}

interface ExamQuestion {
  id: string;
  questionNumber: number;
  difficulty: string;
  points: number;
  subtopicName: string;
  context: string;
  parts: ExamPart[];
}

interface ExamData {
  examTitle: string;
  totalPoints: number;
  timeLimit: number;
  questions: ExamQuestion[];
  topicId: string;
  topicName: string;
}

interface UserAnswer {
  questionId: string;
  partLabel: string;
  answer: string;
}

interface PartResult {
  questionId: string;
  partLabel: string;
  subtopicName: string;
  userAnswer: string;
  correctAnswer: string;
  maxPoints: number;
  earnedPoints: number;
  isCorrect: boolean;
  confidence: 'high' | 'uncertain';
  needsReview: boolean;
}

type ExamPhase = "intro" | "exam" | "grading" | "results";

export default function TopicExam() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [results, setResults] = useState<any>(null);
  const [partResults, setPartResults] = useState<PartResult[]>([]);

  useEffect(() => {
    if (topicId) {
      generateExam();
    }
  }, [topicId]);

  // Timer effect
  useEffect(() => {
    if (phase !== "exam" || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeRemaining]);

  const generateExam = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-topic-exam", {
        body: { topicId, userId: user?.id },
      });

      if (error) throw error;
      setExamData(data);
      setTimeRemaining((data.timeLimit || 45) * 60);
    } catch (error) {
      console.error("Error generating exam:", error);
      toast.error("Failed to generate exam");
    } finally {
      setIsLoading(false);
    }
  };

  const startExam = () => {
    setPhase("exam");
    setExamStartTime(new Date());
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
  };

  const getCurrentAnswer = (questionId: string, partLabel: string) => {
    const answer = userAnswers.find(
      a => a.questionId === questionId && a.partLabel === partLabel
    );
    return answer?.answer || "";
  };

  const setAnswer = (questionId: string, partLabel: string, answer: string) => {
    setUserAnswers(prev => {
      const existing = prev.findIndex(
        a => a.questionId === questionId && a.partLabel === partLabel
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { questionId, partLabel, answer };
        return updated;
      }
      return [...prev, { questionId, partLabel, answer }];
    });
  };

  const handleSubmitExam = async () => {
    if (!examData || !user || !examStartTime) return;

    // Switch to grading phase - show loading
    setPhase("grading");

    const endTime = new Date();
    const timeSpentMinutes = Math.round(
      (endTime.getTime() - examStartTime.getTime()) / 60000
    );

    try {
      // Call server-side DETERMINISTIC grading
      const { data: gradingResult, error: gradingError } = await supabase.functions.invoke(
        "grade-exam-answer",
        {
          body: {
            questions: examData.questions,
            userAnswers,
            userId: user.id,
            topicId: examData.topicId,
          },
        }
      );

      if (gradingError) {
        console.error("Grading error:", gradingError);
        toast.error("Failed to grade exam. Please try again.");
        setPhase("exam");
        return;
      }

      // Check if grading was blocked due to uncertain answers
      if (!gradingResult.canSubmit) {
        toast.error(gradingResult.message || "Some answers could not be verified. Please retry.");
        setPhase("exam");
        return;
      }

      const {
        scorePercentage,
        totalEarned,
        totalPossible,
        isExamReady,
        partResults: serverPartResults,
        subtopicScores,
        weakSubtopics,
      } = gradingResult;

      // Store part results for display
      setPartResults(serverPartResults || []);

      // Save results to database
      try {
        await supabase.from("topic_exam_results").insert({
          user_id: user.id,
          topic_id: examData.topicId,
          score_percentage: scorePercentage,
          questions_correct: Math.round((scorePercentage / 100) * examData.questions.length),
          total_questions: examData.questions.length,
          time_spent_minutes: timeSpentMinutes,
          is_exam_ready: isExamReady,
          subtopic_scores: subtopicScores,
          weak_subtopics: weakSubtopics,
        });

        // Update learning path if weak areas detected
        if (weakSubtopics && weakSubtopics.length > 0) {
          await supabase.functions.invoke("update-learning-path", {
            body: {
              userId: user.id,
              performanceData: {
                topicId: examData.topicId,
                score: scorePercentage,
                weakSubtopics,
              },
              source: "topic_exam",
            },
          });
        }
      } catch (saveError) {
        console.error("Error saving results:", saveError);
        // Continue to show results even if save fails
      }

      setResults({
        scorePercentage,
        totalEarned,
        totalPossible,
        isExamReady,
        timeSpentMinutes,
        subtopicScores,
        weakSubtopics,
      });
      setPhase("results");

    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Failed to submit exam. Please try again.");
      setPhase("exam");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = examData?.questions[currentQuestionIndex];
  const progress = examData ? ((currentQuestionIndex + 1) / examData.questions.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container max-w-4xl">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to Load Exam</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't generate the exam. Please try again.
            </p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {/* Intro Phase */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container max-w-2xl py-12 px-4"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">{examData.examTitle}</CardTitle>
                <CardDescription>
                  Test your readiness for this topic under exam conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{examData.questions.length}</div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{examData.totalPoints}</div>
                    <div className="text-sm text-muted-foreground">Points</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{examData.timeLimit}</div>
                    <div className="text-sm text-muted-foreground">Minutes</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-600">Exam Conditions</div>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• No hints or help available</li>
                        <li>• Timed - answers auto-submit when time runs out</li>
                        <li>• Results will update your learning path</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                    Go Back
                  </Button>
                  <Button className="flex-1" onClick={startExam}>
                    Start Exam
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Exam Phase */}
        {phase === "exam" && currentQuestion && (
          <motion.div
            key="exam"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col"
          >
            {/* Header */}
            <div className="border-b bg-card p-4">
              <div className="container max-w-4xl flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{examData.topicName}</div>
                  <div className="font-medium">
                    Question {currentQuestionIndex + 1} of {examData.questions.length}
                  </div>
                </div>

                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold",
                  timeRemaining < 300 ? "bg-red-500/10 text-red-500" : "bg-muted"
                )}>
                  <Clock className="h-4 w-4" />
                  {formatTime(timeRemaining)}
                </div>
              </div>
              <div className="container max-w-4xl mt-2">
                <Progress value={progress} className="h-1" />
              </div>
            </div>

            {/* Question Content */}
            <ScrollArea className="flex-1">
              <div className="container max-w-4xl py-6 px-4">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline">
                    {currentQuestion.difficulty}
                  </Badge>
                  <Badge variant="secondary">
                    {currentQuestion.points} points
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {currentQuestion.subtopicName}
                  </span>
                </div>

                {currentQuestion.context && (
                  <Card className="mb-4 bg-muted/50">
                    <CardContent className="pt-4">
                      <MathRenderer latex={currentQuestion.context} />
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-6">
                  {currentQuestion.parts.map((part, index) => (
                    <Card key={part.partLabel}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            Part {part.partLabel}) 
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {part.points} points
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <MathRenderer latex={part.question} />
                        </div>
                        <Textarea
                          value={getCurrentAnswer(currentQuestion.id, part.partLabel)}
                          onChange={(e) => setAnswer(currentQuestion.id, part.partLabel, e.target.value)}
                          placeholder="Enter your answer..."
                          className="min-h-[100px]"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t bg-card p-4">
              <div className="container max-w-4xl flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentQuestionIndex === examData.questions.length - 1 ? (
                  <Button onClick={handleSubmitExam}>
                    Submit Exam
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Grading Phase - Loading State */}
        {phase === "grading" && (
          <motion.div
            key="grading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center"
          >
            <Card className="max-w-md">
              <CardContent className="pt-6 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Grading Your Exam</h2>
                <p className="text-muted-foreground">
                  Verifying your answers with our deterministic grading system...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results Phase */}
        {phase === "results" && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container max-w-2xl py-12 px-4"
          >
            <Card>
              <CardHeader className="text-center">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                  results.isExamReady ? "bg-green-500/10" : "bg-yellow-500/10"
                )}>
                  {results.isExamReady ? (
                    <Sparkles className="h-10 w-10 text-green-500" />
                  ) : (
                    <BookOpen className="h-10 w-10 text-yellow-500" />
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {results.isExamReady ? "Exam Ready!" : "Keep Practicing"}
                </CardTitle>
                <CardDescription>
                  {results.isExamReady 
                    ? "You've demonstrated strong understanding of this topic"
                    : "A bit more practice will get you exam-ready"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl font-bold">{results.scorePercentage}%</div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl font-bold">{results.timeSpentMinutes}m</div>
                    <div className="text-sm text-muted-foreground">Time Spent</div>
                  </div>
                </div>

                {/* Per-Part Breakdown */}
                {partResults.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <div className="font-medium mb-3">Answer Breakdown</div>
                    {partResults.slice(0, 6).map((part, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Q{part.questionId?.slice(-2) || idx+1} Part {part.partLabel}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={part.isCorrect ? "text-green-600" : "text-red-500"}>
                            {part.earnedPoints}/{part.maxPoints}
                          </span>
                          {part.isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                    {partResults.length > 6 && (
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        + {partResults.length - 6} more parts
                      </div>
                    )}
                  </div>
                )}

                {results.weakSubtopics && results.weakSubtopics.length > 0 && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="font-medium text-yellow-600 mb-2">Areas to Review</div>
                    <div className="space-y-1">
                      {results.weakSubtopics.map((subtopic: string) => (
                        <div key={subtopic} className="text-sm text-muted-foreground">
                          • {subtopic}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.isExamReady && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Ready for the real exam!</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                  </Button>
                  <Button className="flex-1" onClick={() => {
                    setPhase("intro");
                    setPartResults([]);
                    generateExam();
                  }}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
