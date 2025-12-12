import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LevelBadge, { getLevel } from './LevelBadge';
import { TrendingUp, TrendingDown, Trophy } from 'lucide-react';

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
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base">
            <Trophy className="w-5 h-5 text-[hsl(var(--xp-gold))]" />
            Your Performance
          </span>
          <LevelBadge level={level} showGlow />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <TrendingUp className="w-4 h-4" />
              Your Strengths
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.slice(0, 4).map((s) => (
                <span
                  key={s.subtopic_id}
                  className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {s.subtopic_name}
                </span>
              ))}
              {strengths.length > 4 && (
                <span className="px-2.5 py-1 rounded-full text-xs bg-secondary text-muted-foreground">
                  +{strengths.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--warning))]">
              <TrendingDown className="w-4 h-4" />
              Needs Work
            </div>
            <div className="flex flex-wrap gap-2">
              {weaknesses.slice(0, 4).map((s) => (
                <span
                  key={s.subtopic_id}
                  className="px-2.5 py-1 rounded-full text-xs bg-warning/10 text-[hsl(var(--warning))] border border-warning/20"
                >
                  {s.subtopic_name}
                </span>
              ))}
              {weaknesses.length > 4 && (
                <span className="px-2.5 py-1 rounded-full text-xs bg-secondary text-muted-foreground">
                  +{weaknesses.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* No data yet */}
        {strengths.length === 0 && weaknesses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Complete more exercises to see your strengths and areas for improvement.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
