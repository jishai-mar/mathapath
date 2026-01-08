import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TheoryBlockRow, TheoryBlockData, ExerciseTheoryLink, parseTheoryBlock } from '@/components/theory/types/blocks';

/**
 * Fetch all theory blocks for a given topic
 */
export function useTopicTheoryBlocks(topicId: string | undefined) {
  return useQuery({
    queryKey: ['theory-blocks', topicId],
    queryFn: async () => {
      if (!topicId) return [];

      const { data, error } = await supabase
        .from('theory_blocks')
        .select('*')
        .eq('topic_id', topicId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data || []) as TheoryBlockRow[];
    },
    enabled: !!topicId,
  });
}

/**
 * Fetch theory blocks linked to a specific exercise
 */
export function useExerciseTheoryBlocks(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ['exercise-theory-blocks', exerciseId],
    queryFn: async () => {
      if (!exerciseId) return [];

      const { data, error } = await supabase
        .from('exercise_theory_links')
        .select(`
          id,
          exercise_id,
          theory_block_id,
          relevance,
          created_at,
          theory_blocks (*)
        `)
        .eq('exercise_id', exerciseId)
        .order('relevance', { ascending: true });

      if (error) throw error;
      
      // Transform to include the theory block data
      return (data || []).map(link => ({
        ...link,
        theoryBlock: link.theory_blocks as unknown as TheoryBlockRow,
      }));
    },
    enabled: !!exerciseId,
  });
}

/**
 * Fetch a single theory block by ID
 */
export function useTheoryBlock(blockId: string | undefined) {
  return useQuery({
    queryKey: ['theory-block', blockId],
    queryFn: async () => {
      if (!blockId) return null;

      const { data, error } = await supabase
        .from('theory_blocks')
        .select('*')
        .eq('id', blockId)
        .single();

      if (error) throw error;
      return data as TheoryBlockRow;
    },
    enabled: !!blockId,
  });
}

/**
 * Fetch theory blocks by block numbers (e.g., ["D1", "T2"])
 */
export function useTheoryBlocksByNumbers(topicId: string | undefined, blockNumbers: string[]) {
  return useQuery({
    queryKey: ['theory-blocks-by-numbers', topicId, blockNumbers],
    queryFn: async () => {
      if (!topicId || blockNumbers.length === 0) return [];

      const { data, error } = await supabase
        .from('theory_blocks')
        .select('*')
        .eq('topic_id', topicId)
        .in('block_number', blockNumbers)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data || []) as TheoryBlockRow[];
    },
    enabled: !!topicId && blockNumbers.length > 0,
  });
}

/**
 * Get a summary of theory blocks for a topic (for navigation/TOC)
 */
export function useTheoryBlocksSummary(topicId: string | undefined) {
  return useQuery({
    queryKey: ['theory-blocks-summary', topicId],
    queryFn: async () => {
      if (!topicId) return { definitions: [], theorems: [], methods: [], examples: [] };

      const { data, error } = await supabase
        .from('theory_blocks')
        .select('id, block_type, block_number, title, order_index')
        .eq('topic_id', topicId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const blocks = data || [];
      
      return {
        definitions: blocks.filter(b => b.block_type === 'definition'),
        theorems: blocks.filter(b => b.block_type === 'theorem' || b.block_type === 'property'),
        methods: blocks.filter(b => b.block_type === 'method'),
        examples: blocks.filter(b => b.block_type === 'worked-example'),
        visuals: blocks.filter(b => b.block_type === 'visual'),
        all: blocks,
      };
    },
    enabled: !!topicId,
  });
}
