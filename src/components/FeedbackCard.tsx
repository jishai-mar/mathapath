import { CheckCircle2, XCircle, Lightbulb, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AIFeedback {
  what_went_well: string;
  where_it_breaks: string;
  what_to_focus_on_next: string;
  is_correct: boolean;
  suggested_difficulty: 'easy' | 'medium' | 'hard';
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
                <p className="text-sm text-muted-foreground">{feedback.what_went_well}</p>
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
                <p className="text-sm text-muted-foreground">{feedback.where_it_breaks}</p>
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
                <p className="text-sm text-muted-foreground">{feedback.what_to_focus_on_next}</p>
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
