import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ElevenLabsAgentProps {
  agentId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: 'w-24 h-24',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
};

export function ElevenLabsAgent({
  agentId = 'agent_4501kd82684tegmad70k26kqzs17',
  size = 'md',
  className,
}: ElevenLabsAgentProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create and append the ElevenLabs widget element
    if (widgetRef.current && !widgetRef.current.querySelector('elevenlabs-convai')) {
      const widget = document.createElement('elevenlabs-convai');
      widget.setAttribute('agent-id', agentId);
      widgetRef.current.appendChild(widget);
    }

    return () => {
      // Cleanup on unmount
      if (widgetRef.current) {
        const widget = widgetRef.current.querySelector('elevenlabs-convai');
        if (widget) {
          widget.remove();
        }
      }
    };
  }, [agentId]);

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div 
        className={cn(
          'relative rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20',
          'border-2 border-border/30',
          sizeConfig[size]
        )}
      >
        {/* Visual placeholder while widget loads */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/40 to-primary/40 animate-pulse" />
      </div>
      
      <p className="text-sm text-muted-foreground">
        Klik op de widget rechtsonder om met Gilbert te praten
      </p>
      
      {/* Container for ElevenLabs Embedded Widget */}
      <div ref={widgetRef} className="hidden" />
    </div>
  );
}
