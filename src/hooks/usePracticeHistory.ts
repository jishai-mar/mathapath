import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TimeFilter = '7d' | '30d' | 'all';

export interface PracticeEntry {
  id: string;
  topicName: string;
  subtopicName: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
  createdAt: string;
  hintsUsed: number;
}

export interface GroupedHistory {
  label: string;
  date: string;
  entries: PracticeEntry[];
}

export function usePracticeHistory(timeFilter: TimeFilter = 'all') {
  const { user } = useAuth();
  const [history, setHistory] = useState<GroupedHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchHistory() {
      try {
        let query = supabase
          .from('exercise_attempts')
          .select(`
            id,
            is_correct,
            created_at,
            hints_used,
            exercise_id
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Apply time filter
        if (timeFilter === '7d') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          query = query.gte('created_at', sevenDaysAgo.toISOString());
        } else if (timeFilter === '30d') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          query = query.gte('created_at', thirtyDaysAgo.toISOString());
        }

        const { data: attempts, error } = await query;

        if (error) throw error;

        if (!attempts || attempts.length === 0) {
          setHistory([]);
          setLoading(false);
          return;
        }

        // Get exercise IDs to fetch exercise details
        const exerciseIds = [...new Set(attempts.map(a => a.exercise_id))];
        
        // Fetch exercises with subtopic info from public view
        const { data: exercises } = await supabase
          .from('exercises_public')
          .select('id, subtopic_id, difficulty')
          .in('id', exerciseIds);

        // Get subtopic IDs
        const subtopicIds = [...new Set(exercises?.map(e => e.subtopic_id).filter(Boolean) || [])];
        
        // Fetch subtopics with topic info
        const { data: subtopics } = await supabase
          .from('subtopics')
          .select('id, name, topic_id')
          .in('id', subtopicIds);

        // Get topic IDs
        const topicIds = [...new Set(subtopics?.map(s => s.topic_id) || [])];
        
        // Fetch topics
        const { data: topics } = await supabase
          .from('topics')
          .select('id, name')
          .in('id', topicIds);

        // Build lookup maps
        const exerciseMap = new Map(exercises?.map(e => [e.id, e]) || []);
        const subtopicMap = new Map(subtopics?.map(s => [s.id, s]) || []);
        const topicMap = new Map(topics?.map(t => [t.id, t]) || []);

        // Transform attempts into entries
        const entries: PracticeEntry[] = attempts.map(attempt => {
          const exercise = exerciseMap.get(attempt.exercise_id);
          const subtopic = exercise?.subtopic_id ? subtopicMap.get(exercise.subtopic_id) : null;
          const topic = subtopic?.topic_id ? topicMap.get(subtopic.topic_id) : null;

          return {
            id: attempt.id,
            topicName: topic?.name || 'Unknown Topic',
            subtopicName: subtopic?.name || null,
            difficulty: (exercise?.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
            isCorrect: attempt.is_correct,
            createdAt: attempt.created_at,
            hintsUsed: attempt.hints_used || 0,
          };
        });

        // Group by date
        const grouped = groupByDate(entries);
        setHistory(grouped);
      } catch (error) {
        console.error('Error fetching practice history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [user, timeFilter]);

  return { history, loading };
}

function groupByDate(entries: PracticeEntry[]): GroupedHistory[] {
  const groups: Map<string, PracticeEntry[]> = new Map();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  entries.forEach(entry => {
    const date = entry.createdAt.split('T')[0];
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(entry);
  });

  const result: GroupedHistory[] = [];
  groups.forEach((entries, date) => {
    let label = date;
    if (date === today) {
      label = 'Today';
    } else if (date === yesterday) {
      label = 'Yesterday';
    } else {
      label = new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    result.push({ label, date, entries });
  });

  return result;
}
