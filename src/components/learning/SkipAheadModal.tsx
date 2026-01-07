import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import MathRenderer from "@/components/MathRenderer";

interface PrerequisiteTopic {
  id: string;
  name: string;
  mastery: number;
  isWeak: boolean;
}

interface DiagnosticQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  prerequisiteTopicId: string;
  prerequisiteTopicName: string;
}

interface SkipAheadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTopicId: string;
  targetTopicName: string;
  onProceed: () => void;
  onRedirect: (topicId: string, topicName: string) => void;
}

// STRICT state types - no bypass paths
type ModalState = "checking" | "ready" | "quiz" | "passed" | "failed" | "error";

interface QuizAnswer {
  answer: string;
  isCorrect: boolean;
  checked: boolean;
  confidence: 'high' | 'uncertain';
}

export function SkipAheadModal({
  isOpen,
  onClose,
  targetTopicId,
  targetTopicName,
  onProceed,
  onRedirect,
}: SkipAheadModalProps) {
  const { user } = useAuth();
  const [state, setState] = useState<ModalState>("checking");
  const [prerequisites, setPrerequisites] = useState<PrerequisiteTopic[]>([]);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen && user) {
      checkPrerequisites();
    }
  }, [isOpen, user, targetTopicId]);

  const checkPrerequisites = async () => {
    if (!user) return;
    setState("checking");
    setErrorMessage("");

    try {
      // Fetch prerequisites for the target topic
      const { data: prereqData, error: prereqError } = await supabase
        .from("topic_prerequisites")
        .select(`
          prerequisite_topic_id,
          is_strong_dependency,
          prerequisite:topics!topic_prerequisites_prerequisite_topic_id_fkey(id, name)
        `)
        .eq("topic_id", targetTopicId);

      if (prereqError) throw prereqError;

      if (!prereqData || prereqData.length === 0) {
        // No prerequisites - allow direct access
        setState("passed");
        return;
      }

      // Check user's mastery on each prerequisite
      const prereqTopicIds = prereqData.map((p: any) => p.prerequisite_topic_id);
      
      const { data: progressData, error: progressError } = await supabase
        .from("user_topic_progress")
        .select("topic_id, mastery_percentage")
        .eq("user_id", user.id)
        .in("topic_id", prereqTopicIds);

      if (progressError) throw progressError;

      const progressMap = new Map<string, number>();
      (progressData || []).forEach((p: any) => {
        progressMap.set(p.topic_id, p.mastery_percentage);
      });

      const prereqTopics: PrerequisiteTopic[] = prereqData.map((p: any) => ({
        id: p.prerequisite_topic_id,
        name: p.prerequisite?.name || "Unknown Topic",
        mastery: progressMap.get(p.prerequisite_topic_id) || 0,
        isWeak: (progressMap.get(p.prerequisite_topic_id) || 0) < 60,
      }));

      setPrerequisites(prereqTopics);

      const weakPrereqs = prereqTopics.filter(p => p.isWeak);
      
      if (weakPrereqs.length === 0) {
        // All prerequisites are strong - allow skip
        setState("passed");
      } else {
        // Generate diagnostic questions for weak prerequisites
        await generateDiagnosticQuestions(weakPrereqs);
        setState("ready");
      }
    } catch (error) {
      console.error("Error checking prerequisites:", error);
      setErrorMessage("Failed to check prerequisites. Please try again.");
      setState("error");
    }
  };

  const generateDiagnosticQuestions = async (weakPrereqs: PrerequisiteTopic[]) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-prerequisite-check", {
        body: {
          prerequisites: weakPrereqs.map(p => ({ id: p.id, name: p.name })),
          targetTopicName,
        },
      });

      if (error) throw error;

      if (!data?.questions || data.questions.length === 0) {
        throw new Error("No questions generated");
      }

      setQuestions(data.questions);
    } catch (error) {
      console.error("Error generating questions:", error);
      // STRICT: On generation failure, block skip and show error
      setErrorMessage("Could not generate prerequisite quiz. Please review prerequisites first.");
      setState("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || isChecking) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    setIsChecking(true);
    
    try {
      // Use server-side answer checking - MUST return confidence level
      const { data, error } = await supabase.functions.invoke('check-exercise-answer', {
        body: {
          exerciseId: `prereq-${currentQuestionIndex}`,
          userAnswer: userAnswer.trim(),
          userId: user?.id,
          subtopicName: currentQuestion.prerequisiteTopicName,
          correctAnswer: currentQuestion.correctAnswer,
          hintsUsed: 0,
        },
      });

      // STRICT: On any error, DO NOT allow progression
      if (error || !data) {
        console.error('Answer check failed:', error);
        setErrorMessage("Unable to verify your answer. Please try again.");
        setIsChecking(false);
        return; // Stay on current question, don't record answer
      }

      // Get confidence from server response
      const confidence = data.confidence || 'high';
      
      // STRICT: If confidence is uncertain, block and ask to retry
      if (confidence === 'uncertain') {
        toast.error("Could not verify answer with confidence. Please rephrase your answer.");
        setIsChecking(false);
        return;
      }

      // Only proceed if we have HIGH confidence result
      const isCorrect = data.isCorrect === true && confidence === 'high';

      const newAnswer: QuizAnswer = { 
        answer: userAnswer, 
        isCorrect, 
        checked: true,
        confidence,
      };
      
      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      if (currentQuestionIndex < questions.length - 1) {
        // Move to next question after delay
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          setUserAnswer("");
        }, isCorrect ? 500 : 1200);
      } else {
        // Calculate final results - STRICT threshold
        setTimeout(() => {
          const correctCount = updatedAnswers.filter(a => a.isCorrect && a.confidence === 'high').length;
          const percentage = Math.round((correctCount / questions.length) * 100);

          // STRICT: Must get 70%+ with HIGH confidence answers to pass
          if (percentage >= 70) {
            setState("passed");
          } else {
            setState("failed");
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Error checking answer:', err);
      // STRICT: On ANY error, DO NOT auto-pass. Block and show error.
      setErrorMessage("Verification failed. Please try again.");
      // Stay on current question - do not advance
    } finally {
      setIsChecking(false);
    }
  };

  const startQuiz = () => {
    if (questions.length === 0) {
      setErrorMessage("No quiz questions available. Please review prerequisites.");
      setState("error");
      return;
    }
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setAnswers([]);
    setState("quiz");
  };

  const handleRedirectToPrerequisite = () => {
    const weakestPrereq = prerequisites
      .filter(p => p.isWeak)
      .sort((a, b) => a.mastery - b.mastery)[0];
    
    if (weakestPrereq) {
      onRedirect(weakestPrereq.id, weakestPrereq.name);
    }
    onClose();
  };

  const handleRetry = () => {
    setErrorMessage("");
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    checkPrerequisites();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <AnimatePresence mode="wait">
          {state === "checking" && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center"
            >
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Checking prerequisites...</p>
            </motion.div>
          )}

          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <DialogTitle className="mb-2">Verification Failed</DialogTitle>
              <DialogDescription className="mb-6">
                {errorMessage || "Unable to verify prerequisites. Please review them first."}
              </DialogDescription>

              <div className="space-y-3">
                <Button variant="outline" className="w-full" onClick={handleRetry}>
                  Try Again
                </Button>
                <Button className="w-full" onClick={handleRedirectToPrerequisite}>
                  Review Prerequisites
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {state === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Prerequisite Check Required
                </DialogTitle>
                <DialogDescription>
                  {targetTopicName} builds on concepts you haven't fully mastered yet.
                  Let's do a quick check!
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                {prerequisites.filter(p => p.isWeak).map(prereq => (
                  <div 
                    key={prereq.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{prereq.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-yellow-600">
                      {prereq.mastery}% mastery
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleRedirectToPrerequisite}>
                  Review Prerequisites First
                </Button>
                <Button className="flex-1" onClick={startQuiz} disabled={isLoading || questions.length === 0}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Take Quick Quiz
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {state === "quiz" && currentQuestion && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle>Quick Knowledge Check</DialogTitle>
                <DialogDescription>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </DialogDescription>
              </DialogHeader>

              <Progress value={progress} className="h-2 mt-4" />

              <Card className="mt-4 p-4">
                <Badge variant="outline" className="mb-3">
                  {currentQuestion.prerequisiteTopicName}
                </Badge>
                <div className="text-lg">
                  <MathRenderer latex={currentQuestion.question} />
                </div>
              </Card>

              <div className="mt-4">
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  onKeyDown={(e) => e.key === "Enter" && userAnswer.trim() && !isChecking && handleSubmitAnswer()}
                  autoFocus
                  disabled={isChecking}
                />
                {isChecking && (
                  <p className="text-xs text-muted-foreground mt-2">Verifying answer...</p>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!userAnswer.trim() || isChecking}
                >
                  {isChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {currentQuestionIndex === questions.length - 1 ? "Submit" : "Next"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {state === "passed" && (
            <motion.div
              key="passed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <DialogTitle className="mb-2">You're Ready!</DialogTitle>
              <DialogDescription className="mb-6">
                {questions.length > 0 
                  ? "Great job! You've demonstrated sufficient understanding of the prerequisites."
                  : "No prerequisite gaps detected. You're ready to proceed!"}
              </DialogDescription>
              <Button onClick={onProceed} className="w-full">
                Continue to {targetTopicName}
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {state === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
              <DialogTitle className="mb-2">Let's Build Your Foundation</DialogTitle>
              <DialogDescription className="mb-6">
                The quiz revealed some gaps in prerequisite knowledge. 
                Strengthening these foundations will help you succeed in {targetTopicName}.
              </DialogDescription>

              <div className="space-y-3 mb-6">
                {prerequisites.filter(p => p.isWeak).map((prereq, idx) => {
                  const hasWrongAnswer = answers[idx] && !answers[idx].isCorrect;
                  return (
                    <div 
                      key={prereq.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        hasWrongAnswer
                          ? "bg-red-500/10 border border-red-500/20"
                          : "bg-muted/50"
                      )}
                    >
                      <span>{prereq.name}</span>
                      {hasWrongAnswer ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* STRICT: NO "Skip Anyway" button - must review prerequisites */}
              <Button className="w-full" onClick={handleRedirectToPrerequisite}>
                Review Prerequisites
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
