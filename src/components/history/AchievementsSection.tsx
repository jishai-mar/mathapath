import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, Sparkles, Star, Crown, Zap } from 'lucide-react';
import { useUnlockableItems } from '@/hooks/useUnlockableItems';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const iconMap: Record<string, React.ElementType> = {
  star: Star,
  crown: Crown,
  zap: Zap,
  sparkles: Sparkles,
  trophy: Trophy,
};

export function AchievementsSection() {
  const { allItems, unlockedItems, getProgressToUnlock, isItemUnlocked } = useUnlockableItems();
  const loading = !allItems || allItems.length === 0;

  if (loading && unlockedItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Get earned achievements
  const earnedAchievements = allItems.filter(item => isItemUnlocked(item.id));
  
  // Get "almost there" achievements (progress > 50% but not unlocked)
  const almostThere = allItems
    .filter(item => !isItemUnlocked(item.id))
    .map(item => {
      const progress = getProgressToUnlock(item);
      return { ...item, progress: progress.percentage };
    })
    .filter(item => item.progress > 50)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  if (earnedAchievements.length === 0 && almostThere.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No achievements yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Keep practicing to unlock achievements!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Earned Achievements
              <span className="text-sm font-normal text-muted-foreground">
                ({earnedAchievements.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {earnedAchievements.map((item, index) => {
                const Icon = iconMap[item.icon_key] || Trophy;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                      <Icon className="h-6 w-6 text-amber-500" />
                    </div>
                    <p className="font-medium text-sm text-center">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Almost There */}
      {almostThere.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Almost There
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {almostThere.map(item => {
              const Icon = iconMap[item.icon_key] || Lock;
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <span className="text-sm text-muted-foreground">{Math.round(item.progress)}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
