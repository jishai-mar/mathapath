import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NumberLineProps {
  min: number;
  max: number;
  points: number[];
  labels?: string[];
  className?: string;
}

export function NumberLine({ min, max, points, labels, className }: NumberLineProps) {
  const range = max - min;
  const tickCount = Math.min(range + 1, 11); // Max 11 ticks for readability
  const step = range / (tickCount - 1);
  
  const getPosition = (value: number) => {
    return ((value - min) / range) * 100;
  };
  
  const ticks = Array.from({ length: tickCount }, (_, i) => min + i * step);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 bg-muted/30 rounded-lg border border-border/50", className)}
    >
      <div className="relative h-16">
        {/* Main line */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-foreground/60 -translate-y-1/2" />
        
        {/* Arrow ends */}
        <div className="absolute top-1/2 left-2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-8 border-t-transparent border-b-transparent border-r-foreground/60" />
        <div className="absolute top-1/2 right-2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-8 border-t-transparent border-b-transparent border-l-foreground/60" />
        
        {/* Ticks */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2">
          {ticks.map((tick, i) => (
            <div 
              key={i}
              className="absolute -translate-x-1/2"
              style={{ left: `${getPosition(tick)}%` }}
            >
              <div className="w-0.5 h-3 bg-foreground/60 -translate-y-1/2" />
              <span className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                {Number.isInteger(tick) ? tick : tick.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        
        {/* Points */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2">
          {points.map((point, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${getPosition(point)}%` }}
            >
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-background shadow-lg" />
              {labels?.[i] && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-primary whitespace-nowrap">
                  {labels[i]}
                </span>
              )}
              <span className="absolute top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-primary">
                {point}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
