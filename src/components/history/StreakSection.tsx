import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Target, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { StreakCalendarModal } from './StreakCalendarModal';

interface StreakSectionProps {
  currentStreak: number;
  longestStreak: number;
  streakDays: Date[];
}

export function StreakSection({ currentStreak, longestStreak, streakDays }: StreakSectionProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <>
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500" />
            Your Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-8">
              <motion.div 
                className="text-center"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Flame className={`h-8 w-8 ${currentStreak > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <span className="text-4xl font-bold">{currentStreak}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Current Streak</p>
              </motion.div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Target className="h-6 w-6 text-muted-foreground" />
                  <span className="text-2xl font-semibold text-muted-foreground">{longestStreak}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Longest Streak</p>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCalendar(true)}
              className="border-amber-500/30 hover:bg-amber-500/10"
            >
              <Calendar className="h-4 w-4 mr-2" />
              View streak days
            </Button>
          </div>

          {currentStreak > 0 && (
            <p className="text-sm text-amber-500/80 mt-4">
              🔥 Keep it up! Practice today to maintain your streak.
            </p>
          )}
          {currentStreak === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Start practicing to build your streak!
            </p>
          )}
        </CardContent>
      </Card>

      <StreakCalendarModal 
        open={showCalendar} 
        onClose={() => setShowCalendar(false)}
        streakDays={streakDays}
        currentStreak={currentStreak}
      />
    </>
  );
}
