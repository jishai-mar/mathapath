import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
        // Fetch profile for streak info
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_streak, longest_streak, last_practice_date')
          .eq('id', user.id)
          .single();

        // Fetch exercise attempts for total questions, accuracy, and streak days
        const { data: attempts } = await supabase
          .from('exercise_attempts')
          .select('is_correct, created_at')
          .eq('user_id', user.id);

        // Count unique days with attempts as sessions
        const uniqueSessionDays = new Set<string>();
        const streakDays: Date[] = [];
        
        if (attempts && attempts.length > 0) {
          attempts.forEach(attempt => {
            const date = new Date(attempt.created_at).toISOString().split('T')[0];
            uniqueSessionDays.add(date);
          });
          uniqueSessionDays.forEach(dateStr => {
            streakDays.push(new Date(dateStr));
          });
        }

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
        const totalSessions = uniqueSessionDays.size;

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
          lastPracticedDate: profile?.last_practice_date || null,
          bestTopic,
          currentStreak: profile?.current_streak || 0,
          longestStreak: profile?.longest_streak || 0,
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
