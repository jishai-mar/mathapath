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
}

export interface SessionPlan {
  id: string;
  totalMinutes: number;
  exercises: SessionExercise[];
  focusAreas: string[];
  planRationale: string;
  estimatedExerciseCount: number;
}

export interface ActiveSession {
  id: string;
  plan: SessionPlan;
  startedAt: Date;
  totalMinutes: number;
  currentExerciseIndex: number;
  exercisesCompleted: number;
  exercisesCorrect: number;
  isPaused: boolean;
  messages: SessionMessage[];
}

export interface SessionMessage {
  id: string;
  role: 'tutor' | 'user' | 'system';
  content: string;
  timestamp: Date;
  type?: 'greeting' | 'tip' | 'encouragement' | 'guidance' | 'celebration';
}

export type SessionDuration = 15 | 30 | 45 | 60;
