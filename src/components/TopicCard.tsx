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
      className="premium-card w-full text-left p-5 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
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
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {exercisesCompleted} exercises completed
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
