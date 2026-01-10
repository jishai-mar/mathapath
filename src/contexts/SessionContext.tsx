import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ActiveSession, SessionPlan, SessionMessage, SessionDuration, SessionExercise } from '@/types/session';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SessionContextType {
  activeSession: ActiveSession | null;
  isSessionActive: boolean;
  isPlanning: boolean;
  timeRemaining: number;
  currentExercise: SessionExercise | null;
  
  // Actions
  startPlanning: (duration: SessionDuration, selectedTopicIds?: string[]) => Promise<SessionPlan | null>;
  startSession: (plan: SessionPlan) => void;
  endSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  markExerciseComplete: (wasCorrect: boolean) => void;
  skipExercise: () => void;
  addTutorMessage: (content: string, type?: SessionMessage['type']) => void;
  goToExercise: (index: number) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (activeSession && !activeSession.isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Session time is up
            addTutorMessage("Time's up! Great work today. Let's wrap up this session.", 'celebration');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeSession, activeSession?.isPaused]);

  const startPlanning = useCallback(async (duration: SessionDuration, selectedTopicIds?: string[]): Promise<SessionPlan | null> => {
    if (!user) {
      toast.error('Please log in to start a session');
      return null;
    }

    setIsPlanning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('plan-learning-session', {
        body: {
          userId: user.id,
          durationMinutes: duration,
          selectedTopicIds: selectedTopicIds || [],
        }
      });

      if (error) {
        console.error('Error planning session:', error);
        toast.error('Failed to create session plan. Please try again.');
        return null;
      }

      if (data?.error) {
        if (data.rate_limited) {
          toast.error('AI is busy. Please try again in a moment.');
        } else {
          toast.error(data.error);
        }
        return null;
      }

      return data as SessionPlan;
    } catch (err) {
      console.error('Session planning error:', err);
      toast.error('Something went wrong. Please try again.');
      return null;
    } finally {
      setIsPlanning(false);
    }
  }, [user]);

  const startSession = useCallback((plan: SessionPlan) => {
    const session: ActiveSession = {
      id: crypto.randomUUID(),
      plan,
      startedAt: new Date(),
      totalMinutes: plan.totalMinutes,
      currentExerciseIndex: 0,
      exercisesCompleted: 0,
      exercisesCorrect: 0,
      isPaused: false,
      messages: [{
        id: crypto.randomUUID(),
        role: 'tutor',
        content: `Let's get started! I've planned ${plan.exercises.length} exercises for our ${plan.totalMinutes}-minute session. ${plan.planRationale}`,
        timestamp: new Date(),
        type: 'greeting'
      }]
    };
    
    setActiveSession(session);
    setTimeRemaining(plan.totalMinutes * 60);
  }, []);

  const endSession = useCallback(() => {
    if (activeSession) {
      // Could save session summary here
      toast.success(`Session complete! You solved ${activeSession.exercisesCompleted} exercises.`);
    }
    setActiveSession(null);
    setTimeRemaining(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [activeSession]);

  const pauseSession = useCallback(() => {
    setActiveSession(prev => prev ? { ...prev, isPaused: true } : null);
  }, []);

  const resumeSession = useCallback(() => {
    setActiveSession(prev => prev ? { ...prev, isPaused: false } : null);
  }, []);

  const markExerciseComplete = useCallback((wasCorrect: boolean) => {
    setActiveSession(prev => {
      if (!prev) return null;
      
      const updatedExercises = [...prev.plan.exercises];
      if (updatedExercises[prev.currentExerciseIndex]) {
        updatedExercises[prev.currentExerciseIndex] = {
          ...updatedExercises[prev.currentExerciseIndex],
          completed: true,
          wasCorrect
        };
      }

      const nextIndex = prev.currentExerciseIndex + 1;
      const isLastExercise = nextIndex >= prev.plan.exercises.length;

      return {
        ...prev,
        plan: { ...prev.plan, exercises: updatedExercises },
        exercisesCompleted: prev.exercisesCompleted + 1,
        exercisesCorrect: prev.exercisesCorrect + (wasCorrect ? 1 : 0),
        currentExerciseIndex: isLastExercise ? prev.currentExerciseIndex : nextIndex,
      };
    });
  }, []);

  const skipExercise = useCallback(() => {
    setActiveSession(prev => {
      if (!prev) return null;
      const nextIndex = prev.currentExerciseIndex + 1;
      if (nextIndex >= prev.plan.exercises.length) return prev;
      return { ...prev, currentExerciseIndex: nextIndex };
    });
  }, []);

  const addTutorMessage = useCallback((content: string, type?: SessionMessage['type']) => {
    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, {
          id: crypto.randomUUID(),
          role: 'tutor',
          content,
          timestamp: new Date(),
          type
        }]
      };
    });
  }, []);

  const goToExercise = useCallback((index: number) => {
    setActiveSession(prev => {
      if (!prev || index < 0 || index >= prev.plan.exercises.length) return prev;
      return { ...prev, currentExerciseIndex: index };
    });
  }, []);

  const currentExercise = activeSession?.plan.exercises[activeSession.currentExerciseIndex] || null;

  return (
    <SessionContext.Provider value={{
      activeSession,
      isSessionActive: !!activeSession,
      isPlanning,
      timeRemaining,
      currentExercise,
      startPlanning,
      startSession,
      endSession,
      pauseSession,
      resumeSession,
      markExerciseComplete,
      skipExercise,
      addTutorMessage,
      goToExercise,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
