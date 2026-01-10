import { useCallback, useRef } from 'react';
import { SessionExercise } from '@/types/session';

interface PerformanceMetrics {
  recentCorrect: number;
  recentTotal: number;
  consecutiveWrong: number;
  consecutiveCorrect: number;
  hintsUsedRecently: number;
  averageTimePerExercise: number;
}

interface AdaptationResult {
  shouldAdjustDifficulty: boolean;
  newDifficulty?: 'easy' | 'medium' | 'hard';
  tutorTip?: string;
  tipType?: 'encouragement' | 'guidance' | 'celebration' | 'tip';
}

const TUTOR_TIPS = {
  struggling: [
    "Take your time! Understanding is more important than speed.",
    "Would you like me to show you the step-by-step solution?",
    "Let's try a simpler version of this problem first.",
    "Don't worry about mistakes - they help you learn!",
    "Try reading the hint - it might give you a fresh perspective.",
  ],
  improving: [
    "Nice progress! You're getting the hang of this.",
    "Good work! Try to explain your reasoning out loud.",
    "You're building momentum - keep it up!",
    "I can see you're improving with each problem.",
  ],
  excelling: [
    "Excellent! Ready for a tougher challenge?",
    "You're mastering this! Let's increase the difficulty.",
    "Impressive accuracy! Time to level up.",
    "You've got this down - let's push further!",
  ],
  general: [
    "Remember to check your work before submitting.",
    "Drawing a diagram often helps visualize the problem.",
    "Try breaking this into smaller steps.",
    "What formula or theorem applies here?",
  ],
  comeback: [
    "Great job bouncing back!",
    "That's the persistence I like to see!",
    "You figured it out - well done!",
  ],
};

export function useSessionAdaptation() {
  const metricsRef = useRef<PerformanceMetrics>({
    recentCorrect: 0,
    recentTotal: 0,
    consecutiveWrong: 0,
    consecutiveCorrect: 0,
    hintsUsedRecently: 0,
    averageTimePerExercise: 0,
  });

  const exerciseTimesRef = useRef<number[]>([]);
  const lastTipTimeRef = useRef<number>(0);
  const exerciseStartTimeRef = useRef<number>(Date.now());

  const startExerciseTimer = useCallback(() => {
    exerciseStartTimeRef.current = Date.now();
  }, []);

  const recordExerciseResult = useCallback((wasCorrect: boolean, hintsUsed: number = 0) => {
    const metrics = metricsRef.current;
    const timeSpent = (Date.now() - exerciseStartTimeRef.current) / 1000;
    
    // Track exercise time
    exerciseTimesRef.current.push(timeSpent);
    if (exerciseTimesRef.current.length > 10) {
      exerciseTimesRef.current.shift();
    }
    metrics.averageTimePerExercise = 
      exerciseTimesRef.current.reduce((a, b) => a + b, 0) / exerciseTimesRef.current.length;

    // Update metrics
    metrics.recentTotal++;
    metrics.hintsUsedRecently += hintsUsed;
    
    if (wasCorrect) {
      metrics.recentCorrect++;
      metrics.consecutiveCorrect++;
      metrics.consecutiveWrong = 0;
    } else {
      metrics.consecutiveWrong++;
      metrics.consecutiveCorrect = 0;
    }

    // Keep window of last 5 exercises
    if (metrics.recentTotal > 5) {
      const oldAccuracy = (metrics.recentCorrect - (wasCorrect ? 1 : 0)) / (metrics.recentTotal - 1);
      metrics.recentCorrect = Math.round(oldAccuracy * 4) + (wasCorrect ? 1 : 0);
      metrics.recentTotal = 5;
    }
  }, []);

  const evaluateAdaptation = useCallback((currentDifficulty: 'easy' | 'medium' | 'hard'): AdaptationResult => {
    const metrics = metricsRef.current;
    const result: AdaptationResult = { shouldAdjustDifficulty: false };
    
    const recentAccuracy = metrics.recentTotal > 0 
      ? (metrics.recentCorrect / metrics.recentTotal) * 100 
      : 50;

    // Throttle tips to every 2 minutes minimum
    const now = Date.now();
    const canShowTip = now - lastTipTimeRef.current > 120000;

    // Student is struggling
    if (metrics.consecutiveWrong >= 2 || (metrics.recentTotal >= 3 && recentAccuracy < 40)) {
      result.shouldAdjustDifficulty = currentDifficulty !== 'easy';
      result.newDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
      
      if (canShowTip) {
        result.tutorTip = TUTOR_TIPS.struggling[Math.floor(Math.random() * TUTOR_TIPS.struggling.length)];
        result.tipType = 'guidance';
        lastTipTimeRef.current = now;
      }
    }
    // Student is excelling
    else if (metrics.consecutiveCorrect >= 3 && recentAccuracy >= 80) {
      result.shouldAdjustDifficulty = currentDifficulty !== 'hard';
      result.newDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
      
      if (canShowTip) {
        result.tutorTip = TUTOR_TIPS.excelling[Math.floor(Math.random() * TUTOR_TIPS.excelling.length)];
        result.tipType = 'celebration';
        lastTipTimeRef.current = now;
      }
    }
    // Student just recovered from struggling
    else if (metrics.consecutiveCorrect === 1 && metrics.recentTotal > 3 && recentAccuracy < 60) {
      if (canShowTip) {
        result.tutorTip = TUTOR_TIPS.comeback[Math.floor(Math.random() * TUTOR_TIPS.comeback.length)];
        result.tipType = 'encouragement';
        lastTipTimeRef.current = now;
      }
    }
    // Student is improving
    else if (metrics.consecutiveCorrect >= 2 && canShowTip) {
      result.tutorTip = TUTOR_TIPS.improving[Math.floor(Math.random() * TUTOR_TIPS.improving.length)];
      result.tipType = 'encouragement';
      lastTipTimeRef.current = now;
    }

    return result;
  }, []);

  const getProactiveTip = useCallback((context: {
    timeRemaining: number;
    exercisesCompleted: number;
    totalExercises: number;
    currentExercise?: SessionExercise | null;
  }): { tip: string; type: 'tip' | 'guidance' | 'encouragement' } | null => {
    const now = Date.now();
    if (now - lastTipTimeRef.current < 180000) return null; // 3 min cooldown

    const { timeRemaining, exercisesCompleted, totalExercises } = context;
    const progressPercent = (exercisesCompleted / totalExercises) * 100;

    // Time-based tips
    if (timeRemaining < 300 && timeRemaining > 60) {
      lastTipTimeRef.current = now;
      return {
        tip: "5 minutes left! Let's finish strong with one more exercise.",
        type: 'encouragement',
      };
    }

    // Progress-based tips
    if (progressPercent >= 50 && progressPercent < 55) {
      lastTipTimeRef.current = now;
      return {
        tip: "Halfway there! You're doing great.",
        type: 'encouragement',
      };
    }

    if (progressPercent >= 90) {
      lastTipTimeRef.current = now;
      return {
        tip: "Almost done! Just a few more to go.",
        type: 'encouragement',
      };
    }

    // Random general tips (low probability)
    if (Math.random() < 0.1) {
      lastTipTimeRef.current = now;
      return {
        tip: TUTOR_TIPS.general[Math.floor(Math.random() * TUTOR_TIPS.general.length)],
        type: 'tip',
      };
    }

    return null;
  }, []);

  const getMetrics = useCallback(() => ({ ...metricsRef.current }), []);

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      recentCorrect: 0,
      recentTotal: 0,
      consecutiveWrong: 0,
      consecutiveCorrect: 0,
      hintsUsedRecently: 0,
      averageTimePerExercise: 0,
    };
    exerciseTimesRef.current = [];
    lastTipTimeRef.current = 0;
  }, []);

  return {
    startExerciseTimer,
    recordExerciseResult,
    evaluateAdaptation,
    getProactiveTip,
    getMetrics,
    resetMetrics,
  };
}
