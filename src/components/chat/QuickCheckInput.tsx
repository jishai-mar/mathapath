import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, X, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickCheckInputProps {
  onCheck: (answer: string) => Promise<{ isCorrect: boolean; feedback: string }>;
  onRequestHelp: () => void;
  disabled?: boolean;
}

export function QuickCheckInput({ onCheck, onRequestHelp, disabled }: QuickCheckInputProps) {
  const [answer, setAnswer] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);

  const handleCheck = async () => {
    if (!answer.trim() || isChecking) return;
    
    setIsChecking(true);
    try {
      const checkResult = await onCheck(answer.trim());
      setResult(checkResult);
    } catch (error) {
      console.error('Error checking answer:', error);
      setResult({ isCorrect: false, feedback: 'Could not verify answer. Try again.' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    setAnswer('');
    setResult(null);
  };

  if (result) {
    return (
      <div className={cn(
        "p-3 rounded-lg border space-y-2",
        result.isCorrect 
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-orange-500/10 border-orange-500/30"
      )}>
        <div className="flex items-center gap-2">
          {result.isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <X className="w-5 h-5 text-orange-500" />
          )}
          <span className={cn(
            "font-medium text-sm",
            result.isCorrect ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
          )}>
            {result.isCorrect ? 'Correct!' : 'Not quite right'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{result.feedback}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleReset}>
            Try Another
          </Button>
          {!result.isCorrect && (
            <Button size="sm" variant="secondary" onClick={onRequestHelp}>
              Help Me Understand
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Quick Check - Enter your answer to verify</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer..."
          className="flex-1 bg-secondary/30"
          disabled={disabled || isChecking}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        />
        <Button 
          onClick={handleCheck} 
          disabled={!answer.trim() || isChecking || disabled}
          size="sm"
        >
          {isChecking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Check
              <CheckCircle2 className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
