import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

export interface WeeklyProgressStats {
  thisWeek: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    daysActive: number;
  };
  lastWeek: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    daysActive: number;
  };
  changes: {
    questionsChange: number;
    accuracyChange: number;
    daysActiveChange: number;
  };
}

export function useWeeklyProgress() {
  const { user } = useAuth();
  const [weeklyStats, setWeeklyStats] = useState<WeeklyProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchWeeklyProgress() {
      try {
        const now = new Date();
        
        // Get start and end of this week (Sunday to Saturday)
        const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
        const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 });
        
        // Get start and end of last week
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });

        // Fetch this week's attempts
        const { data: thisWeekAttempts } = await supabase
          .from('exercise_attempts')
          .select('is_correct, created_at')
          .eq('user_id', user.id)
          .gte('created_at', thisWeekStart.toISOString())
          .lte('created_at', thisWeekEnd.toISOString());

        // Fetch last week's attempts
        const { data: lastWeekAttempts } = await supabase
          .from('exercise_attempts')
          .select('is_correct, created_at')
          .eq('user_id', user.id)
          .gte('created_at', lastWeekStart.toISOString())
          .lte('created_at', lastWeekEnd.toISOString());

        // Calculate this week stats
        const thisWeekTotal = thisWeekAttempts?.length || 0;
        const thisWeekCorrect = thisWeekAttempts?.filter(a => a.is_correct).length || 0;
        const thisWeekAccuracy = thisWeekTotal > 0 ? Math.round((thisWeekCorrect / thisWeekTotal) * 100) : 0;
        const thisWeekDays = new Set(
          thisWeekAttempts?.map(a => format(new Date(a.created_at), 'yyyy-MM-dd')) || []
        ).size;

        // Calculate last week stats
        const lastWeekTotal = lastWeekAttempts?.length || 0;
        const lastWeekCorrect = lastWeekAttempts?.filter(a => a.is_correct).length || 0;
        const lastWeekAccuracy = lastWeekTotal > 0 ? Math.round((lastWeekCorrect / lastWeekTotal) * 100) : 0;
        const lastWeekDays = new Set(
          lastWeekAttempts?.map(a => format(new Date(a.created_at), 'yyyy-MM-dd')) || []
        ).size;

        // Calculate changes
        const questionsChange = thisWeekTotal - lastWeekTotal;
        const accuracyChange = thisWeekAccuracy - lastWeekAccuracy;
        const daysActiveChange = thisWeekDays - lastWeekDays;

        setWeeklyStats({
          thisWeek: {
            totalQuestions: thisWeekTotal,
            correctAnswers: thisWeekCorrect,
            accuracy: thisWeekAccuracy,
            daysActive: thisWeekDays,
          },
          lastWeek: {
            totalQuestions: lastWeekTotal,
            correctAnswers: lastWeekCorrect,
            accuracy: lastWeekAccuracy,
            daysActive: lastWeekDays,
          },
          changes: {
            questionsChange,
            accuracyChange,
            daysActiveChange,
          },
        });
      } catch (error) {
        console.error('Error fetching weekly progress:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWeeklyProgress();
  }, [user]);

  return { weeklyStats, loading };
}
