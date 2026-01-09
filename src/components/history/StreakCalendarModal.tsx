import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, isToday } from 'date-fns';

interface StreakCalendarModalProps {
  open: boolean;
  onClose: () => void;
  streakDays: Date[];
  currentStreak: number;
}

export function StreakCalendarModal({ 
  open, 
  onClose, 
  streakDays, 
  currentStreak 
}: StreakCalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();

  // Check if a date has practice
  const hasStreak = (date: Date) => {
    return streakDays.some(d => isSameDay(d, date));
  };

  // Calculate streak range for current streak
  const getStreakStartDate = () => {
    if (currentStreak === 0) return null;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - currentStreak + 1);
    return startDate;
  };

  const streakStartDate = getStreakStartDate();

  const isInCurrentStreak = (date: Date) => {
    if (!streakStartDate || currentStreak === 0) return false;
    const today = new Date();
    return date >= streakStartDate && date <= today && hasStreak(date);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500" />
            Streak Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current streak info */}
          {currentStreak > 0 && streakStartDate && (
            <div className="bg-amber-500/10 rounded-lg p-3 text-sm">
              <span className="font-medium">Current streak:</span>{' '}
              {format(streakStartDate, 'MMM d')} → Today ({currentStreak} days)
            </div>
          )}

          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month start */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {daysInMonth.map(day => {
              const practiced = hasStreak(day);
              const inStreak = isInCurrentStreak(day);
              const today = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    aspect-square flex items-center justify-center rounded-md text-sm
                    transition-colors relative
                    ${practiced ? 'bg-amber-500/20 text-amber-500 font-medium' : 'text-muted-foreground'}
                    ${inStreak ? 'ring-2 ring-amber-500/50' : ''}
                    ${today ? 'bg-primary/10 ring-1 ring-primary' : ''}
                  `}
                >
                  {format(day, 'd')}
                  {practiced && (
                    <Flame className="h-3 w-3 absolute -top-0.5 -right-0.5 text-amber-500" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-amber-500/20 flex items-center justify-center">
                <Flame className="h-2.5 w-2.5 text-amber-500" />
              </div>
              <span>Practice day</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded ring-2 ring-amber-500/50" />
              <span>Current streak</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
