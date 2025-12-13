import { Flame, Sparkles, Target } from 'lucide-react';

interface StatsBarProps {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
}

export function StatsBar({ totalXp, currentStreak, longestStreak }: StatsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl glass border border-border/40">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-xp/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-xp" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total XP</p>
          <p className="font-bold text-lg text-xp">{totalXp.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="h-10 w-px bg-border/50 hidden sm:block" />
      
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
          currentStreak > 0 ? 'bg-streak/10 animate-pulse-glow' : 'bg-muted/50'
        }`}>
          <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-streak' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Streak</p>
          <p className={`font-bold text-lg ${currentStreak > 0 ? 'text-streak' : 'text-muted-foreground'}`}>
            {currentStreak} day{currentStreak !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="h-10 w-px bg-border/50 hidden sm:block" />
      
      <div className="hidden sm:flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Best Streak</p>
          <p className="font-bold text-lg text-accent">{longestStreak} days</p>
        </div>
      </div>
    </div>
  );
}
