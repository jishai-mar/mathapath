/**
 * Unified mastery thresholds across the entire application.
 * Single source of truth for advancement logic.
 */

export interface MasteryThreshold {
  requiredStreak: number;
  requiredAccuracy: number;
  minAttempts: number;
}

export const MASTERY_THRESHOLDS: Record<string, MasteryThreshold> = {
  // Easy → Medium: 3 consecutive correct OR 75% over 5+ attempts
  easy: {
    requiredStreak: 3,
    requiredAccuracy: 75,
    minAttempts: 5,
  },
  // Medium → Hard: 3 consecutive correct OR 75% over 5+ attempts
  medium: {
    requiredStreak: 3,
    requiredAccuracy: 75,
    minAttempts: 5,
  },
  // Hard → Exam: 4 consecutive correct OR 80% over 7+ attempts (higher bar)
  hard: {
    requiredStreak: 4,
    requiredAccuracy: 80,
    minAttempts: 7,
  },
};

// Exam-ready threshold: 80%+ accuracy on topic exam
export const EXAM_READY_THRESHOLD = 70;

// Fast-track threshold: if mastery > 80%, skip easy exercises
export const FAST_TRACK_THRESHOLD = 80;

// Recency weight: if last 2 answers wrong, reset streak
export const RECENCY_RESET_COUNT = 2;

/**
 * Check if student has mastered current difficulty level
 */
export function checkMastery(
  difficulty: 'easy' | 'medium' | 'hard',
  consecutiveCorrect: number,
  totalAttempts: number,
  correctAttempts: number
): { 
  isMastered: boolean; 
  progress: number; 
  progressType: 'streak' | 'accuracy';
  message: string;
} {
  const threshold = MASTERY_THRESHOLDS[difficulty];
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  
  // Check streak first (faster path)
  if (consecutiveCorrect >= threshold.requiredStreak) {
    return {
      isMastered: true,
      progress: 100,
      progressType: 'streak',
      message: `${threshold.requiredStreak} correct in a row! Level up!`,
    };
  }
  
  // Check accuracy (if enough attempts)
  if (totalAttempts >= threshold.minAttempts && accuracy >= threshold.requiredAccuracy) {
    return {
      isMastered: true,
      progress: 100,
      progressType: 'accuracy',
      message: `${Math.round(accuracy)}% accuracy achieved! Level up!`,
    };
  }
  
  // Calculate progress toward mastery
  const streakProgress = (consecutiveCorrect / threshold.requiredStreak) * 100;
  const accuracyProgress = totalAttempts >= threshold.minAttempts 
    ? (accuracy / threshold.requiredAccuracy) * 100 
    : (totalAttempts / threshold.minAttempts) * 50; // Half credit for building up attempts
  
  const progress = Math.max(streakProgress, accuracyProgress);
  const progressType = streakProgress >= accuracyProgress ? 'streak' : 'accuracy';
  
  // Helpful message
  let message: string;
  if (streakProgress > accuracyProgress) {
    const remaining = threshold.requiredStreak - consecutiveCorrect;
    message = `${remaining} more correct in a row to advance`;
  } else if (totalAttempts < threshold.minAttempts) {
    message = `${threshold.minAttempts - totalAttempts} more attempts needed`;
  } else {
    const needed = Math.ceil((threshold.requiredAccuracy * totalAttempts / 100) - correctAttempts);
    message = `Need ${needed} more correct for ${threshold.requiredAccuracy}% accuracy`;
  }
  
  return {
    isMastered: false,
    progress: Math.min(progress, 99),
    progressType,
    message,
  };
}

/**
 * Get calibrated feedback message based on difficulty
 */
export function getCalibratedFeedback(
  isCorrect: boolean, 
  difficulty: 'easy' | 'medium' | 'hard',
  consecutiveCorrect: number
): string {
  if (isCorrect) {
    // Calibrate celebration based on difficulty
    if (difficulty === 'easy') {
      return consecutiveCorrect >= 3 ? 'Nice streak!' : 'Correct!';
    } else if (difficulty === 'medium') {
      return consecutiveCorrect >= 3 ? 'Excellent work!' : 'Nice work!';
    } else {
      // Hard questions deserve more celebration
      return consecutiveCorrect >= 2 ? 'Outstanding! That was challenging!' : 'Excellent! That was a tough one!';
    }
  } else {
    // Encouraging but not over-the-top for incorrect
    const encouragements = [
      "Let's work through this together.",
      "Good attempt! Let's see where to adjust.",
      "Almost there! Let's review the approach.",
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }
}

/**
 * Determine if student should skip to higher difficulty (fast-track)
 */
export function shouldFastTrack(
  currentDifficulty: 'easy' | 'medium' | 'hard',
  existingMastery: number
): 'easy' | 'medium' | 'hard' {
  if (existingMastery >= FAST_TRACK_THRESHOLD) {
    // Skip directly to hard for strong students
    return 'hard';
  } else if (existingMastery >= 60 && currentDifficulty === 'easy') {
    // Start at medium for decent students
    return 'medium';
  }
  return currentDifficulty;
}
