import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: 'Beginner' | 'Developing' | 'Proficient' | 'Mastered';
  className?: string;
  showGlow?: boolean;
}

const levelConfig = {
  Beginner: {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    border: 'border-muted-foreground/30',
    glow: '',
  },
  Developing: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/30',
    glow: '',
  },
  Proficient: {
    bg: 'bg-warning/10',
    text: 'text-[hsl(var(--warning))]',
    border: 'border-warning/30',
    glow: '',
  },
  Mastered: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
    glow: 'shadow-[0_0_12px_hsl(var(--primary)/0.3)]',
  },
};

export function getLevel(masteryPercentage: number): LevelBadgeProps['level'] {
  if (masteryPercentage >= 81) return 'Mastered';
  if (masteryPercentage >= 51) return 'Proficient';
  if (masteryPercentage >= 26) return 'Developing';
  return 'Beginner';
}

export default function LevelBadge({ level, className, showGlow = false }: LevelBadgeProps) {
  const config = levelConfig[level];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.bg,
        config.text,
        config.border,
        showGlow && config.glow,
        className
      )}
    >
      {level}
    </span>
  );
}
