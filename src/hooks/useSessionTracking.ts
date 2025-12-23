import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SessionPhase, EmotionalState } from '@/contexts/TutorSessionContext';

interface SessionData {
  sessionGoal?: string;
  topicsCovered: string[];
  problemsSolved: number;
  hintsUsed: number;
  correctAnswers: number;
  totalAttempts: number;
  dominantEmotion?: EmotionalState;
  sessionSummary?: string;
  xpEarned?: number;
}

export function useSessionTracking() {
  const { user } = useAuth();
  const currentSessionId = useRef<string | null>(null);
  const sessionStartTime = useRef<Date | null>(null);

  const startSession = useCallback(async (sessionGoal?: string) => {
    if (!user) return null;

    sessionStartTime.current = new Date();

    const { data, error } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: user.id,
        session_goal: sessionGoal,
        started_at: sessionStartTime.current.toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error starting session:', error);
      return null;
    }

    currentSessionId.current = data.id;
    return data.id;
  }, [user]);

  const updateSession = useCallback(async (data: Partial<SessionData>) => {
    if (!user || !currentSessionId.current) return;

    const updateData: Record<string, unknown> = {};
    if (data.sessionGoal !== undefined) updateData.session_goal = data.sessionGoal;
    if (data.topicsCovered !== undefined) updateData.topics_covered = data.topicsCovered;
    if (data.problemsSolved !== undefined) updateData.problems_solved = data.problemsSolved;
    if (data.hintsUsed !== undefined) updateData.hints_used = data.hintsUsed;
    if (data.correctAnswers !== undefined) updateData.correct_answers = data.correctAnswers;
    if (data.totalAttempts !== undefined) updateData.total_attempts = data.totalAttempts;
    if (data.dominantEmotion !== undefined) updateData.dominant_emotion = data.dominantEmotion;
    if (data.sessionSummary !== undefined) updateData.session_summary = data.sessionSummary;
    if (data.xpEarned !== undefined) updateData.xp_earned = data.xpEarned;

    const { error } = await supabase
      .from('learning_sessions')
      .update(updateData)
      .eq('id', currentSessionId.current);

    if (error) {
      console.error('Error updating session:', error);
    }
  }, [user]);

  const endSession = useCallback(async (summary?: string) => {
    if (!user || !currentSessionId.current) return;

    const endTime = new Date();
    const durationMinutes = sessionStartTime.current 
      ? Math.round((endTime.getTime() - sessionStartTime.current.getTime()) / 60000)
      : 0;

    const updateData: Record<string, unknown> = {
      ended_at: endTime.toISOString(),
      duration_minutes: durationMinutes,
    };
    
    if (summary) {
      updateData.session_summary = summary;
    }

    const { error } = await supabase
      .from('learning_sessions')
      .update(updateData)
      .eq('id', currentSessionId.current);

    if (error) {
      console.error('Error ending session:', error);
    }

    currentSessionId.current = null;
    sessionStartTime.current = null;
  }, [user]);

  const getSessionHistory = useCallback(async (limit = 20) => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching session history:', error);
      return [];
    }

    return data || [];
  }, [user]);

  const getSessionStats = useCallback(async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching session stats:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    const totalSessions = data.length;
    const totalMinutes = data.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const totalProblems = data.reduce((sum, s) => sum + (s.problems_solved || 0), 0);
    const totalCorrect = data.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
    const totalAttempts = data.reduce((sum, s) => sum + (s.total_attempts || 0), 0);
    const totalXp = data.reduce((sum, s) => sum + (s.xp_earned || 0), 0);

    // Get all topics covered
    const allTopics = data.flatMap(s => s.topics_covered || []);
    const uniqueTopics = [...new Set(allTopics)];

    // Calculate average session length
    const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    // Accuracy rate
    const accuracyRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return {
      totalSessions,
      totalMinutes,
      totalProblems,
      totalCorrect,
      totalAttempts,
      totalXp,
      uniqueTopics,
      avgSessionMinutes,
      accuracyRate,
    };
  }, [user]);

  return {
    startSession,
    updateSession,
    endSession,
    getSessionHistory,
    getSessionStats,
    currentSessionId: currentSessionId.current,
  };
}
