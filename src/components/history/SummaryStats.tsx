import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Target, Calendar, Trophy, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface SummaryStatsProps {
  totalQuestions: number;
  averageAccuracy: number;
  totalSessions: number;
  lastPracticedDate: string | null;
  bestTopic: { name: string; accuracy: number } | null;
}

export function SummaryStats({
  totalQuestions,
  averageAccuracy,
  totalSessions,
  lastPracticedDate,
  bestTopic,
}: SummaryStatsProps) {
  const hasNoData = totalQuestions === 0;

  const stats = [
    {
      label: 'Total Questions',
      value: totalQuestions.toLocaleString(),
      icon: Sparkles,
      gradient: 'from-primary/20 to-primary/5',
      emptyHint: 'Start practicing!',
    },
    {
      label: 'Average Accuracy',
      value: `${averageAccuracy}%`,
      icon: Target,
      gradient: 'from-green-500/20 to-green-500/5',
      emptyHint: 'No data yet',
    },
    {
      label: 'Practice Sessions',
      value: totalSessions.toLocaleString(),
      icon: Clock,
      gradient: 'from-blue-500/20 to-blue-500/5',
      emptyHint: 'Days practiced',
    },
    {
      label: 'Last Practiced',
      value: lastPracticedDate 
        ? format(new Date(lastPracticedDate), 'MMM d, yyyy')
        : 'Never',
      icon: Calendar,
      gradient: 'from-purple-500/20 to-purple-500/5',
    },
    {
      label: 'Best Topic',
      value: bestTopic ? `${bestTopic.name}` : 'N/A',
      subtitle: bestTopic ? `${bestTopic.accuracy}% accuracy` : undefined,
      icon: Trophy,
      gradient: 'from-amber-500/20 to-amber-500/5',
      emptyHint: 'Complete exercises',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`bg-gradient-to-br ${stat.gradient} border-border/50`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-xl font-bold truncate">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
              {hasNoData && stat.emptyHint && !stat.subtitle && (
                <p className="text-xs text-muted-foreground/70 mt-1">{stat.emptyHint}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
