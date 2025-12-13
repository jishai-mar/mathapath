import { motion } from 'framer-motion';
import LevelBadge, { getLevel } from './LevelBadge';
import { TrendingUp, TrendingDown, Trophy, Sparkles } from 'lucide-react';

interface SubtopicProgress {
  subtopic_id: string;
  subtopic_name: string;
  mastery_percentage: number;
  exercises_completed: number;
  exercises_correct: number;
  hints_used: number;
}

interface PerformanceCardProps {
  subtopicProgress: SubtopicProgress[];
  overallMastery: number;
}

export function calculatePerformanceInsights(subtopicProgress: SubtopicProgress[]) {
  const strengths = subtopicProgress.filter(s => 
    s.mastery_percentage >= 70 && s.exercises_completed >= 3
  );
  
  const weaknesses = subtopicProgress.filter(s => {
    if (s.exercises_completed < 2) return false;
    const hintRatio = s.exercises_completed > 0 ? s.hints_used / s.exercises_completed : 0;
    return s.mastery_percentage < 50 || hintRatio > 0.5;
  });
  
  return { strengths, weaknesses };
}

export default function PerformanceCard({ subtopicProgress, overallMastery }: PerformanceCardProps) {
  const { strengths, weaknesses } = calculatePerformanceInsights(subtopicProgress);
  const level = getLevel(overallMastery);

  if (subtopicProgress.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-card/50 border border-border/30 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-xp/10 flex items-center justify-center border border-xp/20">
            <Trophy className="w-5 h-5 text-xp" />
          </div>
          <span className="font-semibold text-foreground">Your Performance</span>
        </div>
        <LevelBadge level={level} showGlow />
      </div>

      <div className="space-y-5">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Strengths</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.slice(0, 4).map((s, idx) => (
                <motion.span
                  key={s.subtopic_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {s.subtopic_name}
                </motion.span>
              ))}
              {strengths.length > 4 && (
                <span className="px-3 py-1.5 rounded-full text-xs bg-border/30 text-muted-foreground">
                  +{strengths.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium text-warning">Needs Work</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {weaknesses.slice(0, 4).map((s, idx) => (
                <motion.span
                  key={s.subtopic_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20"
                >
                  {s.subtopic_name}
                </motion.span>
              ))}
              {weaknesses.length > 4 && (
                <span className="px-3 py-1.5 rounded-full text-xs bg-border/30 text-muted-foreground">
                  +{weaknesses.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* No data yet */}
        {strengths.length === 0 && weaknesses.length === 0 && (
          <div className="text-center py-4">
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Complete more exercises to see your strengths and areas for improvement.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
