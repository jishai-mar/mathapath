import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LearningCheckResponse {
  subtopicId?: string;
  subtopicName: string;
  checkQuestion: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  attempts: number;
  hintUsed: boolean;
  timeSpentSeconds?: number;
}

export function useLearningResponseTracker() {
  const { user } = useAuth();

  const trackResponse = useCallback(async (response: LearningCheckResponse) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('learning_check_responses')
        .insert({
          user_id: user.id,
          subtopic_id: response.subtopicId || null,
          subtopic_name: response.subtopicName,
          check_question: response.checkQuestion,
          user_answer: response.userAnswer,
          correct_answer: response.correctAnswer,
          is_correct: response.isCorrect,
          attempts: response.attempts,
          hint_used: response.hintUsed,
          time_spent_seconds: response.timeSpentSeconds || null,
        });

      if (error) {
        console.error('Error tracking learning response:', error);
      }
    } catch (err) {
      console.error('Failed to track response:', err);
    }
  }, [user]);

  const fetchPastResponses = useCallback(async (subtopicName: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('learning_check_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('subtopic_name', subtopicName)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch past responses:', err);
      return [];
    }
  }, [user]);

  const fetchLearningProfile = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('learning_check_responses')
        .select('subtopic_name, is_correct, attempts, hint_used')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Aggregate into learning profile insights
      const insights = (data || []).reduce((acc, resp) => {
        if (!acc[resp.subtopic_name]) {
          acc[resp.subtopic_name] = {
            totalChecks: 0,
            correct: 0,
            totalAttempts: 0,
            hintsUsed: 0,
          };
        }
        acc[resp.subtopic_name].totalChecks++;
        if (resp.is_correct) acc[resp.subtopic_name].correct++;
        acc[resp.subtopic_name].totalAttempts += resp.attempts;
        if (resp.hint_used) acc[resp.subtopic_name].hintsUsed++;
        return acc;
      }, {} as Record<string, { totalChecks: number; correct: number; totalAttempts: number; hintsUsed: number }>);

      return insights;
    } catch (err) {
      console.error('Failed to fetch learning profile:', err);
      return null;
    }
  }, [user]);

  return { trackResponse, fetchPastResponses, fetchLearningProfile };
}
