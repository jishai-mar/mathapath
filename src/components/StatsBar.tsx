import { motion } from 'framer-motion';
import { Flame, Sparkles, Target } from 'lucide-react';

interface StatsBarProps {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
}

export function StatsBar({ totalXp, currentStreak, longestStreak }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {/* XP */}
      <motion.div 
        className="p-4 sm:p-5 rounded-2xl bg-card/50 border border-border/30 backdrop-blur-sm"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-xp/10 flex items-center justify-center border border-xp/20">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-xp" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total XP</p>
            <p className="font-bold text-lg sm:text-xl text-xp">{totalXp.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Streak */}
      <motion.div 
        className={`p-4 sm:p-5 rounded-2xl bg-card/50 border backdrop-blur-sm ${
          currentStreak > 0 ? 'border-streak/30' : 'border-border/30'
        }`}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${
            currentStreak > 0 
              ? 'bg-streak/10 border-streak/20 animate-pulse-glow' 
              : 'bg-muted/20 border-border/30'
          }`}>
            <Flame className={`w-5 h-5 sm:w-6 sm:h-6 ${currentStreak > 0 ? 'text-streak' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className={`font-bold text-lg sm:text-xl ${currentStreak > 0 ? 'text-streak' : 'text-muted-foreground'}`}>
              {currentStreak}d
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Best Streak */}
      <motion.div 
        className="p-4 sm:p-5 rounded-2xl bg-card/50 border border-border/30 backdrop-blur-sm"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Best</p>
            <p className="font-bold text-lg sm:text-xl text-primary">{longestStreak}d</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
