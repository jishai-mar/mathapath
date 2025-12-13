import { motion } from 'framer-motion';
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
  LucideIcon,
  ChevronRight
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
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="w-full text-left p-5 rounded-2xl bg-card/50 border border-border/30 backdrop-blur-sm hover:border-primary/40 hover:bg-card/80 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors border border-primary/20">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{name}</h3>
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
              <span className="text-primary font-medium">{masteryPercentage}%</span>
            </div>
            <div className="h-2 bg-border/30 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${masteryPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {exercisesCompleted} exercises
              </p>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
