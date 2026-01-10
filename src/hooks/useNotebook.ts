import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SaveExerciseParams, SolutionStep } from '@/components/practice/types';

export interface NotebookEntry {
  id: string;
  note_type: string;
  content: string;
  subtopic_name: string | null;
  detected_at: string;
  mastered_at: string | null;
  related_entry_id: string | null;
  personal_note: string | null;
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

  const markAsMastered = useCallback(async (id: string, createBreakthrough = true): Promise<{ success: boolean; xpEarned: number }> => {
    if (!user) return { success: false, xpEarned: 0 };

    try {
      const entry = entries.find(e => e.id === id);
      if (!entry || entry.note_type !== 'struggle') return { success: false, xpEarned: 0 };

      // Calculate XP based on how long the struggle existed
      const daysStruggling = Math.ceil(
        (Date.now() - new Date(entry.detected_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      // Base XP: 50, bonus for older struggles (max 100 bonus)
      const xpEarned = 50 + Math.min(daysStruggling * 10, 100);

      // Update the struggle as mastered
      const { error: updateError } = await supabase
        .from('student_session_notes')
        .update({ mastered_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error marking as mastered:', updateError);
        return { success: false, xpEarned: 0 };
      }

      // Award XP to user's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', user.id)
        .single();

      const currentXp = profileData?.total_xp || 0;
      await supabase
        .from('profiles')
        .update({ total_xp: currentXp + xpEarned })
        .eq('id', user.id);

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

      return { success: true, xpEarned };
    } catch (err) {
      console.error('Error in markAsMastered:', err);
      return { success: false, xpEarned: 0 };
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

  // Update personal note for an entry
  const updatePersonalNote = useCallback(async (id: string, personalNote: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('student_session_notes')
        .update({ personal_note: personalNote || null })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating personal note:', error);
        return false;
      }

      setEntries(prev => prev.map(e => 
        e.id === id ? { ...e, personal_note: personalNote || null } : e
      ));

      return true;
    } catch (err) {
      console.error('Error in updatePersonalNote:', err);
      return false;
    }
  }, [user]);

  // Format solution steps for notebook content
  const formatSolutionSteps = useCallback((steps: SolutionStep[]): string => {
    return steps.map((step, index) => {
      let stepContent = `**Step ${index + 1}: ${step.title}**\n`;
      if (step.action) stepContent += `${step.action}\n`;
      if (step.calculation) stepContent += `$$${step.calculation}$$\n`;
      if (step.explanation) stepContent += `*${step.explanation}*\n`;
      if (step.theoryCitation) stepContent += `📚 ${step.theoryCitation}\n`;
      return stepContent;
    }).join('\n');
  }, []);

  // Save an exercise to the notebook as a worked example
  const saveExercise = useCallback(async (params: SaveExerciseParams): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to save exercises');
      return false;
    }

    try {
      // Build the content with markdown formatting
      let content = `**Problem:**\n${params.question}\n\n`;
      
      if (params.solutionSteps && params.solutionSteps.length > 0) {
        content += `**Solution:**\n${formatSolutionSteps(params.solutionSteps)}\n`;
      }
      
      if (params.finalAnswer) {
        content += `\n**Final Answer:** $${params.finalAnswer}$\n`;
      }
      
      if (params.tip) {
        content += `\n💡 **Tip:** ${params.tip}\n`;
      }

      const { data, error } = await supabase
        .from('student_session_notes')
        .insert({
          user_id: user.id,
          note_type: 'worked_example',
          content,
          subtopic_name: params.subtopicName,
          personal_note: params.personalNote || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving exercise:', error);
        toast.error('Failed to save exercise');
        return false;
      }

      // Update local state
      if (data) {
        setEntries(prev => {
          const updated = [data as NotebookEntry, ...prev];
          setStats(calculateStats(updated));
          return updated;
        });
      }

      toast.success('Exercise saved to notebook!');
      return true;
    } catch (err) {
      console.error('Error in saveExercise:', err);
      toast.error('Failed to save exercise');
      return false;
    }
  }, [user, calculateStats, formatSolutionSteps]);

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
    updatePersonalNote,
    saveExercise,
  };
}
