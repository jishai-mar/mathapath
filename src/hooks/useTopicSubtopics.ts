import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Subtopic {
  id: string;
  name: string;
  order_index: number;
  theory_explanation: string | null;
}

export interface TopicWithSubtopics {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  subtopics: Subtopic[];
}

export function useTopicSubtopics(databaseTopicId: string | undefined) {
  return useQuery({
    queryKey: ['topic-subtopics', databaseTopicId],
    queryFn: async (): Promise<TopicWithSubtopics | null> => {
      if (!databaseTopicId) return null;
      
      // Fetch topic details
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('id, name, description, icon')
        .eq('id', databaseTopicId)
        .maybeSingle();

      if (topicError) throw topicError;
      if (!topic) return null;

      // Fetch subtopics for this topic
      const { data: subtopics, error: subtopicsError } = await supabase
        .from('subtopics')
        .select('id, name, order_index, theory_explanation')
        .eq('topic_id', databaseTopicId)
        .order('order_index');

      if (subtopicsError) throw subtopicsError;

      return {
        ...topic,
        subtopics: subtopics || [],
      };
    },
    enabled: !!databaseTopicId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Hook to fetch user's progress on subtopics
export function useSubtopicProgress(subtopicIds: string[]) {
  return useQuery({
    queryKey: ['subtopic-progress', subtopicIds],
    queryFn: async () => {
      if (!subtopicIds.length) return {};

      const { data, error } = await supabase
        .from('user_subtopic_progress')
        .select('subtopic_id, mastery_percentage, exercises_completed, exercises_correct')
        .in('subtopic_id', subtopicIds);

      if (error) throw error;

      // Convert to a map for easy lookup
      const progressMap: Record<string, {
        mastery_percentage: number;
        exercises_completed: number;
        exercises_correct: number;
      }> = {};

      data?.forEach((item) => {
        progressMap[item.subtopic_id] = {
          mastery_percentage: item.mastery_percentage,
          exercises_completed: item.exercises_completed,
          exercises_correct: item.exercises_correct,
        };
      });

      return progressMap;
    },
    enabled: subtopicIds.length > 0,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}
