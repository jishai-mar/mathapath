import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Lock, Sparkles, TrendingUp, ArrowRight, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { checkMastery, MASTERY_THRESHOLDS, getCalibratedFeedback } from "@/lib/masteryThresholds";

interface MasteryGateProps {
  currentDifficulty: "easy" | "medium" | "hard" | "exam";
  consecutiveCorrect: number;
  totalAttempts: number;
  correctAttempts: number;
  onAdvance: () => void;
  onReinforce: () => void;
}

const DIFFICULTY_ORDER = ["easy", "medium", "hard", "exam"];
const DIFFICULTY_LABELS = {
  easy: "Fundamentals",
  medium: "Application",
  hard: "Challenge",
  exam: "Exam Level"
};
const DIFFICULTY_COLORS = {
  easy: "bg-green-500",
  medium: "bg-yellow-500",
  hard: "bg-orange-500",
  exam: "bg-red-500"
};

export function MasteryGate({
  currentDifficulty,
  consecutiveCorrect,
  totalAttempts,
  correctAttempts,
  onAdvance,
  onReinforce,
}: MasteryGateProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  // Use unified threshold system
  const threshold = currentDifficulty !== 'exam' 
    ? MASTERY_THRESHOLDS[currentDifficulty]
    : { requiredStreak: 4, requiredAccuracy: 80, minAttempts: 7 };

  const masteryCheck = currentDifficulty !== 'exam' 
    ? checkMastery(currentDifficulty, consecutiveCorrect, totalAttempts, correctAttempts)
    : { isMastered: false, progress: 100, progressType: 'accuracy' as const, message: 'Exam level mastered!' };

  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  const canAdvance = masteryCheck.isMastered;
  const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);
  const nextDifficulty = currentIndex < DIFFICULTY_ORDER.length - 1 
    ? DIFFICULTY_ORDER[currentIndex + 1] as keyof typeof DIFFICULTY_LABELS
    : null;
  const isMaxLevel = currentDifficulty === "exam";

  // Trigger celebration when reaching advancement threshold
  useEffect(() => {
    if (canAdvance && !isMaxLevel) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [canAdvance, isMaxLevel]);

  const streakProgress = Math.min((consecutiveCorrect / threshold.requiredStreak) * 100, 100);
  const accuracyProgress = totalAttempts >= threshold.minAttempts 
    ? Math.min((accuracy / threshold.requiredAccuracy) * 100, 100) 
    : 0;

  // Check for borderline accuracy (close to advancing)
  const isBorderline = !canAdvance && accuracy >= (threshold.requiredAccuracy - 5) && totalAttempts >= threshold.minAttempts;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all",
      canAdvance && !isMaxLevel && "border-primary shadow-lg shadow-primary/10",
      isBorderline && "border-yellow-500/50"
    )}>
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-2" />
              <div className="text-lg font-bold text-primary">
                {masteryCheck.progressType === 'streak' 
                  ? `${threshold.requiredStreak} in a row!` 
                  : `${accuracy}% accuracy!`
                }
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardContent className="pt-6">
        {/* Current Level Display */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              Current Level
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      <strong>How difficulty works:</strong><br/>
                      We adjust difficulty based on your performance. 
                      Master one level to unlock the next.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", DIFFICULTY_COLORS[currentDifficulty])} />
              <span className="font-semibold text-lg">{DIFFICULTY_LABELS[currentDifficulty]}</span>
            </div>
          </div>
          
          {!isMaxLevel && nextDifficulty && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Next Level</div>
              <div className="flex items-center gap-2">
                {canAdvance ? (
                  <Lock className="h-4 w-4 text-primary" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn(
                  "font-medium",
                  canAdvance ? "text-primary" : "text-muted-foreground"
                )}>
                  {DIFFICULTY_LABELS[nextDifficulty]}
                </span>
              </div>
            </div>
          )}

          {isMaxLevel && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              Max Level
            </Badge>
          )}
        </div>

        {/* Progress Indicators */}
        {!isMaxLevel && (
          <div className="space-y-4">
            {/* Streak Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Consecutive Correct
                </span>
                <span className={cn(
                  "font-medium",
                  consecutiveCorrect >= threshold.requiredStreak ? "text-green-500" : "text-foreground"
                )}>
                  {consecutiveCorrect} / {threshold.requiredStreak}
                  {consecutiveCorrect >= threshold.requiredStreak && <CheckCircle2 className="h-4 w-4 inline ml-1" />}
                </span>
              </div>
              <Progress 
                value={streakProgress} 
                className={cn("h-2", consecutiveCorrect >= threshold.requiredStreak && "[&>div]:bg-green-500")}
              />
            </div>

            {/* Accuracy Progress (alternative path) */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  Overall Accuracy ({totalAttempts}/{threshold.minAttempts}+ attempts)
                </span>
                <span className={cn(
                  "font-medium",
                  accuracy >= threshold.requiredAccuracy && totalAttempts >= threshold.minAttempts ? "text-green-500" : "text-foreground"
                )}>
                  {accuracy}% / {threshold.requiredAccuracy}%
                  {accuracy >= threshold.requiredAccuracy && totalAttempts >= threshold.minAttempts && <CheckCircle2 className="h-4 w-4 inline ml-1" />}
                </span>
              </div>
              <Progress 
                value={totalAttempts >= threshold.minAttempts ? accuracyProgress : 0} 
                className={cn("h-2", accuracy >= threshold.requiredAccuracy && totalAttempts >= threshold.minAttempts && "[&>div]:bg-green-500")}
              />
              {totalAttempts < threshold.minAttempts && (
                <p className="text-xs text-muted-foreground mt-1">
                  Complete {threshold.minAttempts - totalAttempts} more exercises to unlock accuracy path
                </p>
              )}
            </div>

            {/* Borderline warning */}
            {isBorderline && (
              <div className="text-xs text-yellow-600 bg-yellow-500/10 rounded-lg p-3">
                <strong>Almost there!</strong> You're at {accuracy}% accuracy. 
                One more correct answer could unlock the next level!
              </div>
            )}

            {/* Advancement Criteria with transparency */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <strong>To advance:</strong> Get {threshold.requiredStreak} correct in a row, 
              OR achieve {threshold.requiredAccuracy}%+ accuracy over {threshold.minAttempts}+ exercises
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {canAdvance && !isMaxLevel ? (
            <Button className="flex-1" onClick={onAdvance}>
              Advance to {nextDifficulty && DIFFICULTY_LABELS[nextDifficulty]}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : !isMaxLevel ? (
            <Button className="flex-1" variant="outline" disabled>
              <Lock className="mr-2 h-4 w-4" />
              Keep Practicing to Unlock
            </Button>
          ) : (
            <Button className="flex-1" variant="secondary">
              <Sparkles className="mr-2 h-4 w-4" />
              Exam Ready!
            </Button>
          )}
          
          {currentIndex > 0 && (
            <Button variant="ghost" onClick={onReinforce}>
              Review Basics
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for managing mastery state - now using unified thresholds
export function useMasteryProgress(subtopicId: string, userId: string | undefined) {
  const [progress, setProgress] = useState({
    currentDifficulty: "easy" as "easy" | "medium" | "hard" | "exam",
    consecutiveCorrect: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    easyMastered: false,
    mediumMastered: false,
    hardMastered: false,
    examReady: false,
    recentAnswers: [] as boolean[], // Track last N answers for recency weight
  });

  const recordAttempt = (isCorrect: boolean) => {
    setProgress(prev => {
      const recentAnswers = [...prev.recentAnswers, isCorrect].slice(-5);
      
      // Recency weight: if last 2 answers wrong, reset streak
      const lastTwo = recentAnswers.slice(-2);
      const recentlyStruggling = lastTwo.length === 2 && !lastTwo[0] && !lastTwo[1];
      
      const newConsecutive = recentlyStruggling ? 0 : (isCorrect ? prev.consecutiveCorrect + 1 : 0);
      const newTotal = prev.totalAttempts + 1;
      const newCorrect = prev.correctAttempts + (isCorrect ? 1 : 0);
      
      return {
        ...prev,
        consecutiveCorrect: newConsecutive,
        totalAttempts: newTotal,
        correctAttempts: newCorrect,
        recentAnswers,
      };
    });
  };

  const advanceDifficulty = () => {
    const order: ("easy" | "medium" | "hard" | "exam")[] = ["easy", "medium", "hard", "exam"];
    setProgress(prev => {
      const currentIndex = order.indexOf(prev.currentDifficulty);
      const nextDifficulty = currentIndex < order.length - 1 
        ? order[currentIndex + 1] 
        : prev.currentDifficulty;
      
      // Mark current level as mastered
      const updates: Partial<typeof prev> = {
        currentDifficulty: nextDifficulty,
        consecutiveCorrect: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        recentAnswers: [],
      };
      
      if (prev.currentDifficulty === "easy") updates.easyMastered = true;
      if (prev.currentDifficulty === "medium") updates.mediumMastered = true;
      if (prev.currentDifficulty === "hard") updates.hardMastered = true;
      if (nextDifficulty === "exam" && prev.currentDifficulty === "hard") updates.examReady = true;
      
      return { ...prev, ...updates };
    });
  };

  const reinforceDifficulty = () => {
    const order: ("easy" | "medium" | "hard" | "exam")[] = ["easy", "medium", "hard", "exam"];
    setProgress(prev => {
      const currentIndex = order.indexOf(prev.currentDifficulty);
      const prevDifficulty = currentIndex > 0 ? order[currentIndex - 1] : prev.currentDifficulty;
      
      return {
        ...prev,
        currentDifficulty: prevDifficulty,
        consecutiveCorrect: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        recentAnswers: [],
      };
    });
  };

  return {
    ...progress,
    recordAttempt,
    advanceDifficulty,
    reinforceDifficulty,
  };
}
