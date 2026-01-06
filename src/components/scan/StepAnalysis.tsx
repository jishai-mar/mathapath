import { Check, X, ArrowRight } from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { cn } from '@/lib/utils';

interface Step {
  step: number;
  content: string;
  status: 'correct' | 'error';
  expected?: string;
}

interface StepAnalysisProps {
  steps: Step[];
  mistakeStep: number | null;
}

export default function StepAnalysis({ steps, mistakeStep }: StepAnalysisProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">Your Solution Steps:</h4>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.step}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-colors",
              step.status === 'error'
                ? "bg-destructive/10 border-destructive/30"
                : "bg-muted/30 border-border"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'correct' ? (
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                  <X className="w-4 h-4 text-destructive" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Step {step.step}
                </span>
                {step.status === 'error' && (
                  <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                    Error here
                  </span>
                )}
              </div>
              
              <div className={cn(
                "text-sm",
                step.status === 'error' && "text-destructive line-through"
              )}>
                <MathRenderer latex={step.content} />
              </div>
              
              {step.status === 'error' && step.expected && (
                <div className="mt-2 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="text-sm text-green-600">
                    <span className="font-medium">Should be: </span>
                    <MathRenderer latex={step.expected} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
