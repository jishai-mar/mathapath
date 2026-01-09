import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, differenceInCalendarDays, format } from 'date-fns';

interface HistoryStats {
  totalQuestions: number;
  averageAccuracy: number;
  totalSessions: number;
  lastPracticedDate: string | null;
  bestTopic: { name: string; accuracy: number } | null;
  currentStreak: number;
  longestStreak: number;
  streakDays: Date[];
}

/**
 * Calculate streaks from a set of practice dates.
 * A streak day = at least one exercise_attempt on that calendar day.
 * Current streak = consecutive days ending today (0 if no exercise today).
 * Longest streak = max consecutive days ever.
 */
function calculateStreaks(practiceDate: Set<string>): { currentStreak: number; longestStreak: number } {
  if (practiceDate.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort dates in ascending order
  const sortedDates = Array.from(practiceDate).sort();
  
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  
  // Check if user practiced today - if not, current streak is 0
  const practicedToday = practiceDate.has(today);
  
  // Calculate consecutive streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const dayDiff = differenceInCalendarDays(currDate, prevDate);
      
      if (dayDiff === 1) {
        // Consecutive day
        tempStreak++;
      } else {
        // Gap in streak
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    // Check if this is the end of the array
    if (i === sortedDates.length - 1) {
      longestStreak = Math.max(longestStreak, tempStreak);
      
      // Current streak only counts if the last practice day is today
      if (sortedDates[i] === today) {
        currentStreak = tempStreak;
      }
    }
  }
  
  return { currentStreak: practicedToday ? currentStreak : 0, longestStreak };
}

export function useHistoryStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HistoryStats>({
    totalQuestions: 0,
    averageAccuracy: 0,
    totalSessions: 0,
    lastPracticedDate: null,
    bestTopic: null,
    currentStreak: 0,
    longestStreak: 0,
    streakDays: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        // Fetch exercise attempts for total questions, accuracy, and streak days
        const { data: attempts } = await supabase
          .from('exercise_attempts')
          .select('is_correct, created_at')
          .eq('user_id', user.id);

        // Build set of unique practice dates (YYYY-MM-DD in local time)
        const practiceDates = new Set<string>();
        const streakDays: Date[] = [];
        let lastPracticedDate: string | null = null;
        
        if (attempts && attempts.length > 0) {
          attempts.forEach(attempt => {
            // Parse UTC timestamp and convert to local date string
            const localDate = startOfDay(new Date(attempt.created_at));
            const dateStr = format(localDate, 'yyyy-MM-dd');
            practiceDates.add(dateStr);
          });
          
          // Convert to Date objects for the calendar
          practiceDates.forEach(dateStr => {
            streakDays.push(new Date(dateStr));
          });
          
          // Get last practiced date
          const sortedDates = Array.from(practiceDates).sort().reverse();
          lastPracticedDate = sortedDates[0] || null;
        }

        // Calculate streaks from exercise_attempts
        const { currentStreak, longestStreak } = calculateStreaks(practiceDates);

        // Fetch topic progress for best topic
        const { data: topicProgress } = await supabase
          .from('user_topic_progress')
          .select('topic_id, exercises_completed, exercises_correct')
          .eq('user_id', user.id);

        // Fetch topics for names
        const { data: topics } = await supabase
          .from('topics')
          .select('id, name');

        // Calculate stats
        const totalQuestions = attempts?.length || 0;
        const correctAnswers = attempts?.filter(a => a.is_correct).length || 0;
        const averageAccuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        const totalSessions = practiceDates.size;

        // Find best topic
        let bestTopic: { name: string; accuracy: number } | null = null;
        if (topicProgress && topicProgress.length > 0 && topics) {
          const topicsWithAccuracy = topicProgress
            .filter(tp => tp.exercises_completed > 0)
            .map(tp => {
              const topic = topics.find(t => t.id === tp.topic_id);
              const accuracy = Math.round((tp.exercises_correct / tp.exercises_completed) * 100);
              return { name: topic?.name || 'Unknown', accuracy };
            })
            .sort((a, b) => b.accuracy - a.accuracy);
          
          if (topicsWithAccuracy.length > 0) {
            bestTopic = topicsWithAccuracy[0];
          }
        }

        setStats({
          totalQuestions,
          averageAccuracy,
          totalSessions,
          lastPracticedDate,
          bestTopic,
          currentStreak,
          longestStreak,
          streakDays: streakDays.sort((a, b) => b.getTime() - a.getTime()),
        });
      } catch (error) {
        console.error('Error fetching history stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return { stats, loading };
}
