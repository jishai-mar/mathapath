import { CheckCircle2, XCircle, Lightbulb, Target, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import MathRenderer from './MathRenderer';

interface MiniExercise {
  question: string;
  hint: string;
}

interface AIFeedback {
  what_went_well: string;
  where_it_breaks: string;
  what_to_focus_on_next: string;
  is_correct: boolean;
  suggested_difficulty: 'easy' | 'medium' | 'hard';
  misconception_tag?: string;
  explanation_variant?: number;
  mini_exercise?: MiniExercise;
  alternative_approach?: string;
}

interface FeedbackCardProps {
  feedback: AIFeedback;
}

export default function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <div className="space-y-3 animate-fade-in">
      {/* Overall result */}
      <Card className={`border-2 ${feedback.is_correct ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5'}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {feedback.is_correct ? (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            ) : (
              <XCircle className="w-6 h-6 text-destructive" />
            )}
            <span className="font-semibold text-lg">
              {feedback.is_correct ? 'Great work!' : 'Not quite right'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* What went well */}
      {feedback.what_went_well && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-primary mb-1">What went well</h4>
                <div className="text-sm text-muted-foreground">
                  <MathRenderer latex={feedback.what_went_well} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Where it breaks */}
      {feedback.where_it_breaks && !feedback.is_correct && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-destructive mb-1">Where it went wrong</h4>
                <div className="text-sm text-muted-foreground">
                  <MathRenderer latex={feedback.where_it_breaks} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative approach (shown on repeated mistakes) */}
      {feedback.alternative_approach && !feedback.is_correct && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-accent mb-1">Try this approach</h4>
                <div className="text-sm text-muted-foreground">
                  <MathRenderer latex={feedback.alternative_approach} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini exercise (shown on repeated mistakes) */}
      {feedback.mini_exercise && !feedback.is_correct && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[hsl(var(--warning))] mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-[hsl(var(--warning))]">Quick practice step</h4>
                <div className="text-sm text-foreground">
                  <MathRenderer latex={feedback.mini_exercise.question} />
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Hint: {feedback.mini_exercise.hint}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What to focus on */}
      {feedback.what_to_focus_on_next && (
        <Card className="border-info/30 bg-info/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-[hsl(var(--info))] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-[hsl(var(--info))] mb-1">Focus on next</h4>
                <div className="text-sm text-muted-foreground">
                  <MathRenderer latex={feedback.what_to_focus_on_next} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Difficulty recommendation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lightbulb className="w-4 h-4" />
        <span>
          Next exercise: <span className="capitalize font-medium">{feedback.suggested_difficulty}</span> difficulty
        </span>
      </div>
    </div>
  );
}
