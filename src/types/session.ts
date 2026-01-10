export interface SessionExercise {
  id?: string;
  subtopicId: string;
  subtopicName: string;
  topicName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reason: string;
  estimatedMinutes: number;
  completed?: boolean;
  wasCorrect?: boolean;
  hintsUsed?: number;
  timeSpent?: number;
}

export interface SessionPlan {
  id: string;
  totalMinutes: number;
  exercises: SessionExercise[];
  focusAreas: string[];
  planRationale: string;
  estimatedExerciseCount: number;
}

export interface PerformanceSnapshot {
  recentAccuracy: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  currentDifficulty: 'easy' | 'medium' | 'hard';
  adaptationsMade: number;
}

export interface ActiveSession {
  id: string;
  plan: SessionPlan;
  startedAt: Date;
  totalMinutes: number;
  currentExerciseIndex: number;
  exercisesCompleted: number;
  exercisesCorrect: number;
  hintsUsedTotal: number;
  isPaused: boolean;
  messages: SessionMessage[];
  performance: PerformanceSnapshot;
}

export interface SessionMessage {
  id: string;
  role: 'tutor' | 'user' | 'system';
  content: string;
  timestamp: Date;
  type?: 'greeting' | 'tip' | 'encouragement' | 'guidance' | 'celebration' | 'adaptation';
}

export interface SessionSummaryData {
  overallFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  nextSteps: string;
  encouragement: string;
  recommendedAction: 'retry' | 'next-topic' | 'review-theory' | 'take-break';
  accuracy: number;
  exercisesCompleted: number;
  durationMinutes: number;
  xpEarned: number;
  difficultyProgression: string;
}

export type SessionDuration = 15 | 30 | 45 | 60;
