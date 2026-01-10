import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ActiveSession, SessionPlan, SessionMessage, SessionDuration, SessionExercise, PerformanceSnapshot } from '@/types/session';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdaptationResult {
  shouldAdjustDifficulty: boolean;
  newDifficulty?: 'easy' | 'medium' | 'hard';
  tutorTip?: string;
  tipType?: 'encouragement' | 'guidance' | 'celebration' | 'tip' | 'adaptation';
}

interface SessionContextType {
  activeSession: ActiveSession | null;
  isSessionActive: boolean;
  isPlanning: boolean;
  timeRemaining: number;
  currentExercise: SessionExercise | null;
  
  // Actions
  startPlanning: (duration: SessionDuration, selectedTopicIds?: string[]) => Promise<SessionPlan | null>;
  startSession: (plan: SessionPlan) => void;
  endSession: () => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  markExerciseComplete: (wasCorrect: boolean, hintsUsed?: number) => AdaptationResult | null;
  skipExercise: () => void;
  addTutorMessage: (content: string, type?: SessionMessage['type']) => void;
  goToExercise: (index: number) => void;
  getAdaptedExercise: () => SessionExercise | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const TUTOR_TIPS = {
  struggling: [
    "Take your time! Understanding is more important than speed.",
    "Would you like me to show you the step-by-step solution?",
    "Let's try a simpler version of this problem first.",
    "Don't worry about mistakes - they help you learn!",
  ],
  excelling: [
    "Excellent! Ready for a tougher challenge?",
    "You're mastering this! Let's increase the difficulty.",
    "Impressive accuracy! Time to level up.",
  ],
  improving: [
    "Nice progress! You're getting the hang of this.",
    "Good work! Try to explain your reasoning out loud.",
    "You're building momentum - keep it up!",
  ],
  comeback: [
    "Great job bouncing back!",
    "That's the persistence I like to see!",
  ],
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dbSessionIdRef = useRef<string | null>(null);

  // Timer logic
  useEffect(() => {
    if (activeSession && !activeSession.isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
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

  const startSession = useCallback(async (plan: SessionPlan) => {
    const initialPerformance: PerformanceSnapshot = {
      recentAccuracy: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      currentDifficulty: plan.exercises[0]?.difficulty || 'medium',
      adaptationsMade: 0,
    };

    const session: ActiveSession = {
      id: crypto.randomUUID(),
      plan,
      startedAt: new Date(),
      totalMinutes: plan.totalMinutes,
      currentExerciseIndex: 0,
      exercisesCompleted: 0,
      exercisesCorrect: 0,
      hintsUsedTotal: 0,
      isPaused: false,
      performance: initialPerformance,
      messages: [{
        id: crypto.randomUUID(),
        role: 'tutor',
        content: `Let's get started! I've planned ${plan.exercises.length} exercises for our ${plan.totalMinutes}-minute session. ${plan.planRationale}`,
        timestamp: new Date(),
        type: 'greeting'
      }]
    };
    
    // Save session to database
    if (user) {
      const { data } = await supabase
        .from('learning_sessions')
        .insert({
          user_id: user.id,
          session_goal: plan.focusAreas.join(', '),
          started_at: session.startedAt.toISOString(),
          starting_difficulty: initialPerformance.currentDifficulty,
        })
        .select('id')
        .single();
      
      if (data) {
        dbSessionIdRef.current = data.id;
      }
    }

    setActiveSession(session);
    setTimeRemaining(plan.totalMinutes * 60);
  }, [user]);

  const endSession = useCallback(async () => {
    if (!activeSession) return;

    const durationMinutes = Math.round((Date.now() - activeSession.startedAt.getTime()) / 60000);
    const accuracy = activeSession.exercisesCompleted > 0
      ? Math.round((activeSession.exercisesCorrect / activeSession.exercisesCompleted) * 100)
      : 0;

    // Generate AI summary
    let summaryText = `Completed ${activeSession.exercisesCompleted} exercises with ${accuracy}% accuracy.`;

    // Save to database
    if (user && dbSessionIdRef.current) {
      const topicsCovered = [...new Set(activeSession.plan.exercises.map(e => e.topicName))];
      
      await supabase
        .from('learning_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_minutes: durationMinutes,
          problems_solved: activeSession.exercisesCompleted,
          correct_answers: activeSession.exercisesCorrect,
          hints_used: activeSession.hintsUsedTotal,
          topics_covered: topicsCovered,
          final_difficulty: activeSession.performance.currentDifficulty,
          session_summary: summaryText,
          xp_earned: activeSession.exercisesCorrect * 10 + activeSession.exercisesCompleted * 5,
        })
        .eq('id', dbSessionIdRef.current);
    }

    toast.success(`Session complete! You solved ${activeSession.exercisesCompleted} exercises with ${accuracy}% accuracy.`);
    
    setActiveSession(null);
    setTimeRemaining(0);
    dbSessionIdRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [activeSession, user]);

  const pauseSession = useCallback(() => {
    setActiveSession(prev => prev ? { ...prev, isPaused: true } : null);
  }, []);

  const resumeSession = useCallback(() => {
    setActiveSession(prev => prev ? { ...prev, isPaused: false } : null);
  }, []);

  const evaluateAdaptation = useCallback((performance: PerformanceSnapshot, currentDifficulty: 'easy' | 'medium' | 'hard'): AdaptationResult => {
    const result: AdaptationResult = { shouldAdjustDifficulty: false };

    // Student is struggling
    if (performance.consecutiveWrong >= 2 || (performance.recentAccuracy < 40 && performance.consecutiveWrong >= 1)) {
      result.shouldAdjustDifficulty = currentDifficulty !== 'easy';
      result.newDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
      result.tutorTip = TUTOR_TIPS.struggling[Math.floor(Math.random() * TUTOR_TIPS.struggling.length)];
      result.tipType = 'guidance';
    }
    // Student is excelling
    else if (performance.consecutiveCorrect >= 3 && performance.recentAccuracy >= 80) {
      result.shouldAdjustDifficulty = currentDifficulty !== 'hard';
      result.newDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
      result.tutorTip = TUTOR_TIPS.excelling[Math.floor(Math.random() * TUTOR_TIPS.excelling.length)];
      result.tipType = 'celebration';
    }
    // Student just recovered from struggling
    else if (performance.consecutiveCorrect === 1 && performance.consecutiveWrong === 0 && performance.recentAccuracy < 60) {
      result.tutorTip = TUTOR_TIPS.comeback[Math.floor(Math.random() * TUTOR_TIPS.comeback.length)];
      result.tipType = 'encouragement';
    }
    // Student is improving steadily
    else if (performance.consecutiveCorrect >= 2) {
      result.tutorTip = TUTOR_TIPS.improving[Math.floor(Math.random() * TUTOR_TIPS.improving.length)];
      result.tipType = 'encouragement';
    }

    return result;
  }, []);

  const markExerciseComplete = useCallback((wasCorrect: boolean, hintsUsed: number = 0): AdaptationResult | null => {
    let adaptationResult: AdaptationResult | null = null;

    setActiveSession(prev => {
      if (!prev) return null;
      
      const updatedExercises = [...prev.plan.exercises];
      if (updatedExercises[prev.currentExerciseIndex]) {
        updatedExercises[prev.currentExerciseIndex] = {
          ...updatedExercises[prev.currentExerciseIndex],
          completed: true,
          wasCorrect,
          hintsUsed,
        };
      }

      // Update performance metrics
      const newExercisesCompleted = prev.exercisesCompleted + 1;
      const newExercisesCorrect = prev.exercisesCorrect + (wasCorrect ? 1 : 0);
      const recentAccuracy = (newExercisesCorrect / newExercisesCompleted) * 100;

      const newPerformance: PerformanceSnapshot = {
        recentAccuracy,
        consecutiveCorrect: wasCorrect ? prev.performance.consecutiveCorrect + 1 : 0,
        consecutiveWrong: wasCorrect ? 0 : prev.performance.consecutiveWrong + 1,
        currentDifficulty: prev.performance.currentDifficulty,
        adaptationsMade: prev.performance.adaptationsMade,
      };

      // Evaluate if we should adapt
      adaptationResult = evaluateAdaptation(newPerformance, prev.performance.currentDifficulty);
      
      if (adaptationResult.shouldAdjustDifficulty && adaptationResult.newDifficulty) {
        newPerformance.currentDifficulty = adaptationResult.newDifficulty;
        newPerformance.adaptationsMade++;
      }

      const nextIndex = prev.currentExerciseIndex + 1;
      const isLastExercise = nextIndex >= prev.plan.exercises.length;

      // Add tutor message if there's a tip
      let newMessages = [...prev.messages];
      if (adaptationResult.tutorTip) {
        newMessages.push({
          id: crypto.randomUUID(),
          role: 'tutor',
          content: adaptationResult.tutorTip,
          timestamp: new Date(),
          type: adaptationResult.tipType,
        });
      }

      return {
        ...prev,
        plan: { ...prev.plan, exercises: updatedExercises },
        exercisesCompleted: newExercisesCompleted,
        exercisesCorrect: newExercisesCorrect,
        hintsUsedTotal: prev.hintsUsedTotal + hintsUsed,
        currentExerciseIndex: isLastExercise ? prev.currentExerciseIndex : nextIndex,
        performance: newPerformance,
        messages: newMessages,
      };
    });

    return adaptationResult;
  }, [evaluateAdaptation]);

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

  // Get an exercise adapted to current difficulty
  const getAdaptedExercise = useCallback((): SessionExercise | null => {
    if (!activeSession) return null;
    
    const currentDifficulty = activeSession.performance.currentDifficulty;
    const currentIndex = activeSession.currentExerciseIndex;
    const exercises = activeSession.plan.exercises;
    
    // If current exercise matches adapted difficulty, return it
    const current = exercises[currentIndex];
    if (current && current.difficulty === currentDifficulty) {
      return current;
    }
    
    // Otherwise, modify the exercise to use adapted difficulty
    if (current) {
      return { ...current, difficulty: currentDifficulty };
    }
    
    return null;
  }, [activeSession]);


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
      getAdaptedExercise,
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
