import { Flame, Sparkles, Target } from 'lucide-react';

interface StatsBarProps {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
}

export function StatsBar({ totalXp, currentStreak, longestStreak }: StatsBarProps) {
  return (
    <div className="flex items-center gap-6 p-4 rounded-xl bg-card border border-border/50">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-xp/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-xp" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total XP</p>
          <p className="font-semibold text-xp">{totalXp.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="h-8 w-px bg-border" />
      
      <div className="flex items-center gap-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          currentStreak > 0 ? 'bg-streak/10 animate-streak-fire' : 'bg-muted'
        }`}>
          <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-streak' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Streak</p>
          <p className={`font-semibold ${currentStreak > 0 ? 'text-streak' : 'text-muted-foreground'}`}>
            {currentStreak} day{currentStreak !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="h-8 w-px bg-border hidden sm:block" />
      
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Best Streak</p>
          <p className="font-semibold text-accent">{longestStreak} days</p>
        </div>
      </div>
    </div>
  );
}
