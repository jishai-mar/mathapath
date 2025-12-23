import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotebookEntry {
  id: string;
  note_type: string;
  content: string;
  subtopic_name: string | null;
  detected_at: string;
}

export interface NotebookStats {
  totalEntries: number;
  breakthroughs: number;
  struggles: number;
  interests: number;
}

export function useNotebook() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [stats, setStats] = useState<NotebookStats>({
    totalEntries: 0,
    breakthroughs: 0,
    struggles: 0,
    interests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_session_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false });

      if (error) {
        console.error('Error fetching notebook entries:', error);
        return;
      }

      setEntries(data || []);

      // Calculate stats
      const notes = data || [];
      setStats({
        totalEntries: notes.length,
        breakthroughs: notes.filter(n => n.note_type === 'breakthrough').length,
        struggles: notes.filter(n => n.note_type === 'struggle').length,
        interests: notes.filter(n => n.note_type === 'interest').length,
      });
    } catch (err) {
      console.error('Error in fetchEntries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('student_session_notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting entry:', error);
        return false;
      }

      setEntries(prev => prev.filter(e => e.id !== id));
      return true;
    } catch (err) {
      console.error('Error in deleteEntry:', err);
      return false;
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    stats,
    isLoading,
    refetch: fetchEntries,
    deleteEntry,
  };
}
