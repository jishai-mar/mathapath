import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Calendar, Target, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeeklyProgressStats } from '@/hooks/useWeeklyProgress';

interface WeeklyProgressCardProps {
  weeklyStats: WeeklyProgressStats;
}

function ChangeIndicator({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="h-3.5 w-3.5" />
        <span>No change</span>
      </span>
    );
  }

  const isPositive = value > 0;

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-sm font-medium',
        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      <span>
        {isPositive ? '+' : ''}
        {value}
        {suffix}
      </span>
    </span>
  );
}

function StatBlock({
  label,
  thisWeek,
  change,
  icon: Icon,
  suffix = '',
  delay = 0,
}: {
  label: string;
  thisWeek: number;
  change: number;
  icon: React.ElementType;
  suffix?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col gap-1 p-3 bg-muted/30 rounded-lg"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold">
        {thisWeek}
        {suffix}
      </p>
      <ChangeIndicator value={change} suffix={suffix} />
    </motion.div>
  );
}

export function WeeklyProgressCard({ weeklyStats }: WeeklyProgressCardProps) {
  const { thisWeek, changes } = weeklyStats;
  
  // Determine overall trend
  const overallPositive = 
    (changes.questionsChange >= 0 ? 1 : -1) + 
    (changes.accuracyChange >= 0 ? 1 : -1) + 
    (changes.daysActiveChange >= 0 ? 1 : -1) >= 0;

  const hasAnyActivity = thisWeek.totalQuestions > 0 || weeklyStats.lastWeek.totalQuestions > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {overallPositive ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              Weekly Progress
            </CardTitle>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              vs. last week
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {!hasAnyActivity ? (
            <div className="text-center py-4 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No practice data yet this week.</p>
              <p className="text-sm">Start practicing to see your progress!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <StatBlock
                label="Questions"
                thisWeek={thisWeek.totalQuestions}
                change={changes.questionsChange}
                icon={CheckCircle2}
                delay={0.1}
              />
              <StatBlock
                label="Accuracy"
                thisWeek={thisWeek.accuracy}
                change={changes.accuracyChange}
                icon={Target}
                suffix="%"
                delay={0.2}
              />
              <StatBlock
                label="Days Active"
                thisWeek={thisWeek.daysActive}
                change={changes.daysActiveChange}
                icon={Calendar}
                delay={0.3}
              />
            </div>
          )}

          {/* Encouraging message based on progress */}
          {hasAnyActivity && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 pt-3 border-t border-border"
            >
              <p className="text-sm text-muted-foreground">
                {getEncouragingMessage(weeklyStats)}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getEncouragingMessage(stats: WeeklyProgressStats): string {
  const { changes, thisWeek, lastWeek } = stats;

  // First week of practice
  if (lastWeek.totalQuestions === 0 && thisWeek.totalQuestions > 0) {
    return `Great start! You've tackled ${thisWeek.totalQuestions} questions this week. Keep building your momentum! 🚀`;
  }

  // Significant improvement
  if (changes.questionsChange > 0 && changes.accuracyChange > 0) {
    return `Fantastic week! You practiced more AND improved your accuracy. That's the winning combination! 🌟`;
  }

  // More practice
  if (changes.questionsChange > 5) {
    return `You're on fire! ${changes.questionsChange} more questions than last week shows real dedication! 🔥`;
  }

  // Accuracy improved
  if (changes.accuracyChange >= 5) {
    return `Your accuracy improved by ${changes.accuracyChange}%! Quality over quantity is paying off! ✨`;
  }

  // More active days
  if (changes.daysActiveChange > 0) {
    return `You practiced ${changes.daysActiveChange} more day(s) this week. Consistency is the key to mastery! 💪`;
  }

  // Slight dip but still active
  if (thisWeek.totalQuestions > 0 && changes.questionsChange < 0) {
    return `Every week is different. You're still making progress, and that's what matters! 📈`;
  }

  // Maintained streak
  if (changes.questionsChange === 0 && thisWeek.totalQuestions > 0) {
    return `Steady progress! You're maintaining your practice habit perfectly. 👏`;
  }

  // No activity this week
  if (thisWeek.totalQuestions === 0) {
    return `Ready to get back on track? Even a few minutes of practice can make a difference! 💡`;
  }

  return `Keep up the great work! Every question you solve brings you closer to mastery. 🎯`;
}
