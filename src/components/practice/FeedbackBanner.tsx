import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MathRenderer from '@/components/MathRenderer';

interface TutorFeedback {
  what_went_well?: string;
  where_it_breaks?: string;
  what_to_focus_on_next?: string;
  emotional_support?: string;
}

interface FeedbackBannerProps {
  isCorrect: boolean | null;
  message: string;
  tutorFeedback?: TutorFeedback | null;
  correctAnswer?: string;
  onNextExercise?: () => void;
  onStartWalkthrough?: () => void;
  mode: 'practice' | 'walkthrough' | 'review';
}

export function FeedbackBanner({
  isCorrect,
  message,
  tutorFeedback,
  correctAnswer,
  onNextExercise,
  onStartWalkthrough,
  mode
}: FeedbackBannerProps) {
  if (isCorrect === null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main feedback banner */}
      <div
        className={`p-4 rounded-xl border ${
          isCorrect
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-destructive/10 border-destructive/20'
        }`}
      >
        <div className="flex items-start gap-3">
          {isCorrect ? (
            <div className="p-2 rounded-full bg-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          ) : (
            <div className="p-2 rounded-full bg-destructive/20">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
          )}
          
          <div className="flex-1">
            <h3
              className={`font-semibold mb-1 ${
                isCorrect ? 'text-green-700 dark:text-green-400' : 'text-destructive'
              }`}
            >
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </h3>
            <div className="text-sm text-muted-foreground">
              <MathRenderer latex={message} />
            </div>
          </div>
        </div>
      </div>

      {/* Tutor feedback for incorrect answers */}
      {!isCorrect && tutorFeedback && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-muted/50 border border-border space-y-3"
        >
          {tutorFeedback.emotional_support && (
            <div className="flex items-start gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-muted-foreground italic">
                <MathRenderer latex={tutorFeedback.emotional_support} />
              </div>
            </div>
          )}
          
          {tutorFeedback.what_went_well && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                What went well
              </p>
              <div className="text-sm">
                <MathRenderer latex={tutorFeedback.what_went_well} />
              </div>
            </div>
          )}
          
          {tutorFeedback.where_it_breaks && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Where to check
              </p>
              <div className="text-sm">
                <MathRenderer latex={tutorFeedback.where_it_breaks} />
              </div>
            </div>
          )}
          
          {tutorFeedback.what_to_focus_on_next && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Tip
              </p>
              <div className="text-sm text-primary">
                <MathRenderer latex={tutorFeedback.what_to_focus_on_next} />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {isCorrect ? (
          <Button onClick={onNextExercise} className="flex-1 gap-2">
            <ArrowRight className="w-4 h-4" />
            Next Exercise
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              onClick={onStartWalkthrough}
              className="flex-1 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Walkthrough This Problem
            </Button>
            <Button 
              onClick={onNextExercise}
              className="flex-1 gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Try New Exercise
            </Button>
          </>
        )}
      </div>

      {/* Show correct answer for incorrect attempts */}
      {!isCorrect && correctAnswer && mode === 'review' && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Correct answer:</p>
          <div className="font-medium">
            <MathRenderer latex={correctAnswer} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
