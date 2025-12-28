import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Circle, Loader2, Target, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTopicSubtopics, useSubtopicProgress } from '@/hooks/useTopicSubtopics';
import { cn } from '@/lib/utils';

interface SubtopicsPanelProps {
  databaseTopicId: string;
  topicSlug: string;
}

export function SubtopicsPanel({ databaseTopicId, topicSlug }: SubtopicsPanelProps) {
  const navigate = useNavigate();
  const { data: topicData, isLoading } = useTopicSubtopics(databaseTopicId);
  const subtopicIds = topicData?.subtopics?.map((s) => s.id) || [];
  const { data: progressMap } = useSubtopicProgress(subtopicIds);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading subtopics...</span>
        </div>
      </div>
    );
  }

  if (!topicData || !topicData.subtopics?.length) {
    return null;
  }

  // Calculate overall progress
  const totalProgress = Object.values(progressMap || {});
  const averageMastery = totalProgress.length > 0
    ? Math.round(totalProgress.reduce((acc, p) => acc + p.mastery_percentage, 0) / totalProgress.length)
    : 0;
  const completedCount = totalProgress.filter((p) => p.mastery_percentage >= 80).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border/50 bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 px-6 py-5 border-b border-border/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">What You'll Learn</h3>
            <p className="text-sm text-muted-foreground">
              {topicData.subtopics.length} subtopics • {completedCount} mastered
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Topic Progress</span>
            <span className="font-medium text-foreground">{averageMastery}%</span>
          </div>
          <Progress value={averageMastery} className="h-2" />
        </div>
      </div>

      {/* Subtopics list */}
      <div className="divide-y divide-border/50">
        {topicData.subtopics.map((subtopic, index) => {
          const progress = progressMap?.[subtopic.id];
          const mastery = progress?.mastery_percentage || 0;
          const isMastered = mastery >= 80;
          const isStarted = mastery > 0;

          return (
            <motion.button
              key={subtopic.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/practice?topic=${topicSlug}&subtopic=${subtopic.id}`)}
              className={cn(
                "w-full px-6 py-4 flex items-center gap-4 text-left transition-colors",
                "hover:bg-accent/50 focus:outline-none focus:bg-accent/50"
              )}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {isMastered ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : isStarted ? (
                  <div className="relative">
                    <Circle className="w-5 h-5 text-primary/30" />
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: `conic-gradient(hsl(var(--primary)) ${mastery}%, transparent ${mastery}%)`,
                        borderRadius: '50%',
                        WebkitMask: 'radial-gradient(transparent 60%, black 60%)',
                        mask: 'radial-gradient(transparent 60%, black 60%)',
                      }}
                    />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium",
                    isMastered ? "text-foreground" : "text-foreground/90"
                  )}>
                    {subtopic.name}
                  </span>
                  {isMastered && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                      Mastered
                    </Badge>
                  )}
                </div>
                {progress && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {progress.exercises_completed} exercises • {mastery}% mastery
                  </p>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </motion.button>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="p-4 bg-accent/30 border-t border-border/50">
        <Button
          variant="default"
          className="w-full gap-2"
          onClick={() => navigate(`/practice?topic=${topicSlug}`)}
        >
          <Target className="w-4 h-4" />
          Practice All Subtopics
        </Button>
      </div>
    </motion.div>
  );
}
