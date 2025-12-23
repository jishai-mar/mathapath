import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotebookEntry {
  id: string;
  note_type: string;
  content: string;
  subtopic_name: string | null;
  detected_at: string;
  mastered_at: string | null;
  related_entry_id: string | null;
}

export interface NotebookStats {
  totalEntries: number;
  breakthroughs: number;
  struggles: number;
  interests: number;
  masteredStruggles: number;
  activeStruggles: number;
}

export function useNotebook() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [stats, setStats] = useState<NotebookStats>({
    totalEntries: 0,
    breakthroughs: 0,
    struggles: 0,
    interests: 0,
    masteredStruggles: 0,
    activeStruggles: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const calculateStats = useCallback((notes: NotebookEntry[]) => {
    const struggles = notes.filter(n => n.note_type === 'struggle');
    const masteredStruggles = struggles.filter(n => n.mastered_at !== null);
    
    return {
      totalEntries: notes.length,
      breakthroughs: notes.filter(n => n.note_type === 'breakthrough').length,
      struggles: struggles.length,
      interests: notes.filter(n => n.note_type === 'interest').length,
      masteredStruggles: masteredStruggles.length,
      activeStruggles: struggles.length - masteredStruggles.length,
    };
  }, []);

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

      const typedData = (data || []) as NotebookEntry[];
      setEntries(typedData);
      setStats(calculateStats(typedData));
    } catch (err) {
      console.error('Error in fetchEntries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, calculateStats]);

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

      setEntries(prev => {
        const updated = prev.filter(e => e.id !== id);
        setStats(calculateStats(updated));
        return updated;
      });
      return true;
    } catch (err) {
      console.error('Error in deleteEntry:', err);
      return false;
    }
  }, [user, calculateStats]);

  const markAsMastered = useCallback(async (id: string, createBreakthrough = true) => {
    if (!user) return false;

    try {
      const entry = entries.find(e => e.id === id);
      if (!entry || entry.note_type !== 'struggle') return false;

      // Update the struggle as mastered
      const { error: updateError } = await supabase
        .from('student_session_notes')
        .update({ mastered_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error marking as mastered:', updateError);
        return false;
      }

      // Optionally create a related breakthrough entry
      if (createBreakthrough) {
        const { data: breakthroughData, error: insertError } = await supabase
          .from('student_session_notes')
          .insert({
            user_id: user.id,
            note_type: 'breakthrough',
            content: `Overcame challenge: ${entry.content}`,
            subtopic_name: entry.subtopic_name,
            related_entry_id: id,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating breakthrough:', insertError);
        }

        // Update the struggle to reference the breakthrough
        if (breakthroughData) {
          await supabase
            .from('student_session_notes')
            .update({ related_entry_id: breakthroughData.id })
            .eq('id', id);
        }
      }

      // Update local state
      setEntries(prev => {
        const updated = prev.map(e => 
          e.id === id ? { ...e, mastered_at: new Date().toISOString() } : e
        );
        setStats(calculateStats(updated));
        return updated;
      });

      // Refetch to get the new breakthrough entry
      if (createBreakthrough) {
        await fetchEntries();
      }

      return true;
    } catch (err) {
      console.error('Error in markAsMastered:', err);
      return false;
    }
  }, [user, entries, calculateStats, fetchEntries]);

  const unmarkMastered = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('student_session_notes')
        .update({ mastered_at: null })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error unmarking mastered:', error);
        return false;
      }

      setEntries(prev => {
        const updated = prev.map(e => 
          e.id === id ? { ...e, mastered_at: null } : e
        );
        setStats(calculateStats(updated));
        return updated;
      });

      return true;
    } catch (err) {
      console.error('Error in unmarkMastered:', err);
      return false;
    }
  }, [user, calculateStats]);

  // Get the related entry for a given entry
  const getRelatedEntry = useCallback((entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry?.related_entry_id) return null;
    return entries.find(e => e.id === entry.related_entry_id) || null;
  }, [entries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    stats,
    isLoading,
    refetch: fetchEntries,
    deleteEntry,
    markAsMastered,
    unmarkMastered,
    getRelatedEntry,
  };
}
