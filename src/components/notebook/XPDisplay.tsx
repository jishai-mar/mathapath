import { motion } from 'framer-motion';
import { Zap, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useUserXP } from '@/hooks/useUserXP';

interface XPDisplayProps {
  compact?: boolean;
}

export function XPDisplay({ compact = false }: XPDisplayProps) {
  const { totalXp, level, xpInCurrentLevel, xpForNextLevel, progressToNextLevel, isLoading } = useUserXP();

  if (isLoading) {
    return (
      <div className="h-8 w-24 bg-muted/50 rounded-lg animate-pulse" />
    );
  }

  if (compact) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30"
      >
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-bold text-amber-400">{totalXp.toLocaleString()}</span>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20"
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-amber-400 flex items-center justify-center">
            <span className="text-[10px] font-bold text-amber-400">{level}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-foreground">Level {level}</span>
          <span className="text-xs text-muted-foreground">
            {xpInCurrentLevel}/{xpForNextLevel} XP
          </span>
        </div>
        <Progress value={progressToNextLevel} className="h-1.5 bg-amber-500/20" />
      </div>

      <div className="text-right">
        <div className="flex items-center gap-1 text-amber-400">
          <Zap className="w-4 h-4" />
          <span className="text-lg font-bold">{totalXp.toLocaleString()}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Total XP</span>
      </div>
    </motion.div>
  );
}
