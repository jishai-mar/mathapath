import { Progress } from '@/components/ui/progress';
import LevelBadge, { getLevel } from './LevelBadge';
import { 
  Calculator, 
  Divide, 
  Square, 
  Radical, 
  TrendingUp, 
  ChevronsLeftRight,
  Superscript,
  LogIn,
  MoveDiagonal,
  CircleDot,
  Infinity,
  Activity,
  LucideIcon
} from 'lucide-react';

interface TopicCardProps {
  name: string;
  description: string | null;
  icon: string;
  masteryPercentage: number;
  exercisesCompleted: number;
  onClick: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  equal: Calculator,
  divide: Divide,
  square: Square,
  radical: Radical,
  'trending-up': TrendingUp,
  'chevrons-left-right': ChevronsLeftRight,
  superscript: Superscript,
  'log-in': LogIn,
  'move-diagonal': MoveDiagonal,
  arc: CircleDot,
  infinity: Infinity,
  activity: Activity,
  calculator: Calculator,
};

export function TopicCard({ 
  name, 
  description, 
  icon, 
  masteryPercentage, 
  exercisesCompleted,
  onClick 
}: TopicCardProps) {
  const Icon = iconMap[icon] || Calculator;
  const level = getLevel(masteryPercentage);

  return (
    <button
      onClick={onClick}
      className="topic-card w-full text-left p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            {exercisesCompleted > 0 && (
              <LevelBadge level={level} className="flex-shrink-0" />
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          )}
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mastery</span>
              <span className="text-muted-foreground">{masteryPercentage}%</span>
            </div>
            <Progress value={masteryPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {exercisesCompleted} exercises completed
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
