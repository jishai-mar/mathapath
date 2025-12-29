/**
 * Type definitions for the Practice Question system
 */

export interface Exercise {
  id: string;
  question: string;
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[] | null;
  explanation?: string;
  subtopicId: string;
  subtopicName: string;
  topicName?: string;
}

export interface SolutionStep {
  stepNumber: number;
  title: string;
  action: string;
  calculation: string;
  explanation: string;
}

export interface TheoryContent {
  title: string;
  explanation: string;
  keyFormulas: string[];
  miniExample?: {
    problem: string;
    solution: string;
  } | null;
}

export interface ExerciseDetails {
  theory: TheoryContent;
  solutionSteps: SolutionStep[];
  finalAnswer: string;
  tip: string;
}

export type PracticeMode = 'practice' | 'walkthrough' | 'review';

export interface PracticeState {
  currentExercise: Exercise | null;
  exerciseDetails: ExerciseDetails | null;
  studentAnswer: string;
  revealedStepCount: number;
  isTheoryOpen: boolean;
  isSolutionOpen: boolean;
  mode: PracticeMode;
  isCorrect: boolean | null;
  feedbackMessage: string;
  isLoading: boolean;
  isSubmitting: boolean;
  exerciseCount: number;
  correctCount: number;
}
