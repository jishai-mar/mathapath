import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle2, 
  Eye, 
  ChevronRight, 
  Send,
  Loader2,
  Trophy,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import MathRenderer from '@/components/MathRenderer';
import { Exercise, ExerciseDetails, PracticeMode } from './types';
import { HintStepper } from './HintStepper';
import { FeedbackBanner } from './FeedbackBanner';
import ToolPanel from '@/components/tools/ToolPanel';

interface PracticeQuestionCardProps {
  exercise: Exercise | null;
  exerciseDetails: ExerciseDetails | null;
  studentAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  onOpenTheory: () => void;
  onOpenSolution: () => void;
  onRevealHint: () => void;
  onNextExercise: () => void;
  onStartWalkthrough: () => void;
  revealedStepCount: number;
  isCorrect: boolean | null;
  feedbackMessage: string;
  tutorFeedback?: any;
  correctAnswer?: string;
  isSubmitting: boolean;
  isLoading: boolean;
  mode: PracticeMode;
  exerciseCount: number;
  correctCount: number;
}

export function PracticeQuestionCard({
  exercise,
  exerciseDetails,
  studentAnswer,
  onAnswerChange,
  onSubmit,
  onOpenTheory,
  onOpenSolution,
  onRevealHint,
  onNextExercise,
  onStartWalkthrough,
  revealedStepCount,
  isCorrect,
  feedbackMessage,
  tutorFeedback,
  correctAnswer,
  isSubmitting,
  isLoading,
  mode,
  exerciseCount,
  correctCount
}: PracticeQuestionCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting && studentAnswer.trim()) {
      onSubmit();
    }
  };

  const difficultyColors = {
    easy: 'bg-green-500/10 text-green-600 border-green-500/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    hard: 'bg-red-500/10 text-red-600 border-red-500/20'
  };

  if (isLoading || !exercise) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading exercise...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={difficultyColors[exercise.difficulty]}>
              {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {exercise.subtopicName}
            </span>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-medium">{correctCount}</span>
              <span className="text-muted-foreground">/ {exerciseCount}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        <div className="p-6 rounded-2xl bg-muted/30 border border-border">
          <div className="text-lg font-medium leading-relaxed">
            <MathRenderer latex={exercise.question} />
          </div>
        </div>

        {/* Action Buttons - Always visible */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTheory}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Read Theory</span>
            <span className="sm:hidden">Theory</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSolution}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Full Solution</span>
            <span className="sm:hidden">Solution</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRevealHint}
            disabled={!exerciseDetails?.solutionSteps || revealedStepCount >= (exerciseDetails?.solutionSteps?.length || 0)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Next Step</span>
            <span className="sm:hidden">Hint</span>
            {exerciseDetails?.solutionSteps && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {revealedStepCount}/{exerciseDetails.solutionSteps.length}
              </Badge>
            )}
          </Button>
          
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!studentAnswer.trim() || isSubmitting || isCorrect !== null}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Check
          </Button>
        </div>

        {/* Hint Stepper - Show revealed hints */}
        {revealedStepCount > 0 && (
          <HintStepper
            steps={exerciseDetails?.solutionSteps || null}
            revealedCount={revealedStepCount}
            onRevealNext={onRevealHint}
          />
        )}

        {/* Answer Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Your Answer
          </label>
          <div className="flex gap-3">
            <Input
              value={studentAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your answer..."
              disabled={isSubmitting || isCorrect !== null}
              className="flex-1 text-lg h-12"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Use standard notation: fractions as 3/4, exponents as x^2, ± for plus-minus
          </p>
        </div>

        {/* Feedback */}
        {isCorrect !== null && (
          <FeedbackBanner
            isCorrect={isCorrect}
            message={feedbackMessage}
            tutorFeedback={tutorFeedback}
            correctAnswer={correctAnswer}
            onNextExercise={onNextExercise}
            onStartWalkthrough={onStartWalkthrough}
            mode={mode}
          />
        )}
      </CardContent>
      
      {/* Graph Calculator */}
      <ToolPanel 
        subtopicName={exercise?.subtopicName || ''} 
        suggestion={{ graph: true, calculator: true }}
      />
    </Card>
  );
}
