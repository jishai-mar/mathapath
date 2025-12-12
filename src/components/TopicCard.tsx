import { Progress } from '@/components/ui/progress';
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
  
  const getMasteryColor = (percentage: number) => {
    if (percentage >= 80) return 'text-primary';
    if (percentage >= 50) return 'text-warning';
    if (percentage > 0) return 'text-info';
    return 'text-muted-foreground';
  };

  const getMasteryLabel = (percentage: number) => {
    if (percentage >= 80) return 'Mastered';
    if (percentage >= 50) return 'Intermediate';
    if (percentage > 0) return 'Beginner';
    return 'Not started';
  };

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
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          )}
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={getMasteryColor(masteryPercentage)}>
                {getMasteryLabel(masteryPercentage)}
              </span>
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
