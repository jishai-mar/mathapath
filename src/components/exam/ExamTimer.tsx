import { useState, useEffect, useCallback } from 'react';
import { Clock, Pause, Play, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  isPaused?: boolean;
  onPauseToggle?: () => void;
}

export function ExamTimer({ 
  durationMinutes, 
  onTimeUp, 
  isPaused = false,
  onPauseToggle 
}: ExamTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (isPaused || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remainingSeconds, onTimeUp]);

  useEffect(() => {
    // Warning at 30 minutes
    setIsWarning(remainingSeconds <= 30 * 60 && remainingSeconds > 10 * 60);
    // Critical at 10 minutes
    setIsCritical(remainingSeconds <= 10 * 60);
  }, [remainingSeconds]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progressPercent = (remainingSeconds / (durationMinutes * 60)) * 100;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-lg border transition-colors",
      isCritical && "bg-destructive/10 border-destructive text-destructive animate-pulse",
      isWarning && !isCritical && "bg-yellow-500/10 border-yellow-500 text-yellow-600",
      !isWarning && !isCritical && "bg-muted border-border"
    )}>
      {isCritical ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5 text-muted-foreground" />
      )}
      
      <div className="flex flex-col">
        <span className={cn(
          "text-lg font-mono font-bold",
          isCritical && "text-destructive",
          isWarning && !isCritical && "text-yellow-600"
        )}>
          {formatTime(remainingSeconds)}
        </span>
        <div className="w-24 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000",
              isCritical && "bg-destructive",
              isWarning && !isCritical && "bg-yellow-500",
              !isWarning && !isCritical && "bg-primary"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {onPauseToggle && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onPauseToggle}
          className="ml-2"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
