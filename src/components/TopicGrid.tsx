import { motion } from 'framer-motion';
import { 
  Calculator, 
  Divide, 
  Square, 
  TrendingUp, 
  ChevronsLeftRight,
  Superscript,
  LogIn,
  MoveDiagonal,
  CircleDot,
  Infinity,
  Activity,
  LucideIcon,
  ArrowRight,
  Sigma,
  Play,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Topic {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  order_index: number;
}

interface TopicProgress {
  masteryPercentage: number;
  exercisesCompleted: number;
}

interface TopicGridProps {
  topics: Topic[];
  getTopicProgress: (topicId: string) => TopicProgress;
  diagnosticStatuses: Array<{ topic_id: string; status: string }>;
  onTopicClick: (topicId: string) => void;
}

const iconMap: Record<string, LucideIcon> = {
  equal: Calculator,
  divide: Divide,
  square: Square,
  'trending-up': TrendingUp,
  'chevrons-left-right': ChevronsLeftRight,
  superscript: Superscript,
  'log-in': LogIn,
  'move-diagonal': MoveDiagonal,
  arc: CircleDot,
  infinity: Infinity,
  activity: Activity,
  calculator: Calculator,
  sigma: Sigma,
};

// Group topics into categories
const topicCategories: Record<string, string[]> = {
  'Foundations': ['Linear Equations', 'Fractions & Algebraic Expressions', 'Quadratic Equations'],
  'Advanced Algebra': ['Radical Equations', 'Higher Degree Equations', 'Inequalities'],
  'Exponential & Logarithmic': ['Exponents & Exponential Equations', 'Logarithms & Logarithmic Equations'],
  'Functions & Graphs': ['Linear Functions & Lines', 'Quadratic Functions & Parabolas'],
  'Calculus': ['Limits', 'Derivatives & Applications'],
};

function getMasteryLevel(percentage: number): { label: string; color: string; bgColor: string; borderColor: string } {
  if (percentage >= 80) return { 
    label: 'Mastered', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  };
  if (percentage >= 50) return { 
    label: 'Proficient', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  };
  if (percentage > 0) return { 
    label: 'Developing', 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  };
  return { 
    label: 'Not Started', 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted/10',
    borderColor: 'border-border'
  };
}

function TopicCard({ 
  topic, 
  progress, 
  isCurrent, 
  isCompleted,
  onClick,
  index 
}: { 
  topic: Topic; 
  progress: TopicProgress;
  isCurrent: boolean;
  isCompleted: boolean;
  onClick: () => void;
  index: number;
}) {
  const Icon = iconMap[topic.icon] || Calculator;
  const masteryLevel = getMasteryLevel(progress.masteryPercentage);
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative text-left p-5 rounded-xl border transition-all duration-300",
        "bg-card/40 backdrop-blur-sm hover:bg-card/70",
        isCurrent 
          ? "border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/20" 
          : "border-border/40 hover:border-primary/30 hover:shadow-md"
      )}
    >
      {/* Current indicator */}
      {isCurrent && (
        <div className="absolute -top-px left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
          isCurrent 
            ? "bg-primary/20 text-primary" 
            : progress.masteryPercentage >= 80
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        
        {/* Status badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide",
          isCurrent 
            ? "bg-primary/20 text-primary"
            : masteryLevel.bgColor, masteryLevel.color
        )}>
          {progress.masteryPercentage >= 80 && <CheckCircle2 className="w-3 h-3" />}
          {isCurrent ? 'Current' : masteryLevel.label}
        </div>
      </div>
      
      {/* Content */}
      <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
        {topic.name}
      </h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[32px]">
        {topic.description || 'Master this fundamental concept.'}
      </p>
      
      {/* Mastery bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Mastery</span>
          <span className={cn(
            "font-medium tabular-nums",
            progress.masteryPercentage >= 80 ? "text-emerald-400" :
            progress.masteryPercentage >= 50 ? "text-blue-400" :
            progress.masteryPercentage > 0 ? "text-amber-400" : "text-muted-foreground"
          )}>
            {progress.masteryPercentage}%
          </span>
        </div>
        <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
          <motion.div 
            className={cn(
              "h-full rounded-full",
              progress.masteryPercentage >= 80 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
              progress.masteryPercentage >= 50 ? "bg-gradient-to-r from-blue-500 to-blue-400" :
              progress.masteryPercentage > 0 ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-muted"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress.masteryPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.03 }}
          />
        </div>
      </div>
      
      {/* Action hint */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {progress.exercisesCompleted} exercises
        </span>
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium transition-all",
          isCurrent ? "text-primary" : "text-muted-foreground group-hover:text-primary"
        )}>
          {isCurrent ? (
            <>
              Continue <Play className="w-3 h-3" />
            </>
          ) : (
            <>
              Start <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function TopicGrid({ topics, getTopicProgress, diagnosticStatuses, onTopicClick }: TopicGridProps) {
  // Find current topic (first incomplete)
  const currentTopicId = topics.find(t => {
    const diagnostic = diagnosticStatuses.find(d => d.topic_id === t.id);
    const prog = getTopicProgress(t.id);
    return (!diagnostic || diagnostic.status !== 'completed') || prog.masteryPercentage < 80;
  })?.id;

  // Calculate overall progress
  const totalMastery = topics.reduce((sum, t) => sum + getTopicProgress(t.id).masteryPercentage, 0);
  const averageMastery = Math.round(totalMastery / topics.length);
  const masteredCount = topics.filter(t => getTopicProgress(t.id).masteryPercentage >= 80).length;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-foreground mb-2">Learning Path</h2>
          <p className="text-sm text-muted-foreground">
            {topics.length} topics · {masteredCount} mastered · {averageMastery}% average mastery
          </p>
        </div>
        
        {/* Progress summary */}
        <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Mastered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">Proficient</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">Developing</span>
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {topics.map((topic, index) => {
          const progress = getTopicProgress(topic.id);
          const diagnostic = diagnosticStatuses.find(d => d.topic_id === topic.id);
          const isCompleted = diagnostic?.status === 'completed';
          const isCurrent = topic.id === currentTopicId;
          
          return (
            <TopicCard
              key={topic.id}
              topic={topic}
              progress={progress}
              isCurrent={isCurrent}
              isCompleted={isCompleted}
              onClick={() => onTopicClick(topic.id)}
              index={index}
            />
          );
        })}
      </div>
    </div>
  );
}
