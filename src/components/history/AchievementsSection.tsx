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
  const loading = !allItems;

  if (loading) {
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
  
  // Get "almost there" achievements (progress > 0 but not unlocked) - show top 5
  const almostThere = allItems
    .filter(item => !isItemUnlocked(item.id))
    .map(item => {
      const progress = getProgressToUnlock(item);
      return { ...item, progress: progress.percentage };
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  // Get locked achievements to show (items with 0 progress)
  const lockedAchievements = allItems
    .filter(item => !isItemUnlocked(item.id))
    .map(item => {
      const progress = getProgressToUnlock(item);
      return { ...item, progress: progress.percentage };
    })
    .filter(item => item.progress === 0)
    .slice(0, 4);

  const hasNoAchievements = earnedAchievements.length === 0 && almostThere.every(a => a.progress === 0);

  return (
    <div className="space-y-6">
      {/* Earned Achievements */}
      <Card className={earnedAchievements.length === 0 ? 'border-dashed' : ''}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className={`h-5 w-5 ${earnedAchievements.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            Earned Achievements
            <span className="text-sm font-normal text-muted-foreground">
              ({earnedAchievements.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnedAchievements.length === 0 ? (
            <div className="text-center py-6">
              <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No achievements unlocked yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Keep practicing to earn your first!</p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Almost There / In Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {hasNoAchievements ? 'Locked Achievements' : 'Almost There'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {almostThere.length === 0 && lockedAchievements.length === 0 ? (
            <div className="text-center py-6">
              <Lock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No achievements available</p>
            </div>
          ) : (
            (hasNoAchievements ? lockedAchievements : almostThere).map(item => {
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
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
