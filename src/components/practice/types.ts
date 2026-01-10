/**
 * Type definitions for the Practice Question system
 * Theory-First Architecture: All solutions must reference stored theory blocks
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
  conceptsTested?: string[];
}

/**
 * A solution step with mandatory theory citations
 * Every step MUST reference a theory block
 */
export interface SolutionStep {
  stepNumber: number;
  title: string;
  action: string;
  calculation: string;
  explanation: string;
  /** UUID of the theory block (optional for backwards compatibility) */
  theoryBlockId?: string;
  /** Display label e.g. "T1", "M2", "A3" (required for new solutions) */
  theoryBlockReference?: string;
  /** Full citation e.g. "By Theorem T1 (Equal Bases Principle)" */
  theoryCitation?: string;
}

/**
 * Theory-based hint that only references existing theory
 * Hints may NOT introduce new reasoning or perform algebraic steps
 */
export interface TheoryBasedHint {
  hintNumber: number;
  type: 'identify-method' | 'cite-theorem' | 'cite-definition' | 'cite-example';
  theoryBlockId: string;
  theoryBlockReference: string;
  message: string;
}

/**
 * Linked theory block with relevance level
 */
export interface LinkedTheoryBlock {
  id: string;
  blockNumber: string;
  blockType: string;
  title: string;
  relevance: 'primary' | 'secondary' | 'reference';
  content: Record<string, unknown>;
}

/**
 * Legacy theory content (for backwards compatibility during transition)
 * @deprecated Use LinkedTheoryBlock[] instead
 */
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
  /** @deprecated Use linkedTheory instead */
  theory?: TheoryContent;
  /** Theory blocks linked to this exercise from database */
  linkedTheory?: LinkedTheoryBlock[];
  solutionSteps: SolutionStep[];
  finalAnswer: string;
  tip: string;
  /** Theory-based hints (new system) */
  theoryHints?: TheoryBasedHint[];
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
  linkedTheoryBlocks?: LinkedTheoryBlock[];
}

/**
 * Validation error for theory-first enforcement
 */
export interface TheoryValidationError {
  type: 'missing_theory_link' | 'missing_step_reference' | 'invalid_block_id';
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Validates that a solution step has proper theory references
 */
export function validateSolutionStep(step: SolutionStep): TheoryValidationError | null {
  if (!step.theoryBlockReference && !step.theoryBlockId) {
    return {
      type: 'missing_step_reference',
      message: `Step ${step.stepNumber} has no theory reference`,
      context: { step }
    };
  }
  return null;
}

/**
 * Validates that an exercise has linked theory
 */
export function validateExerciseTheory(linkedTheory: LinkedTheoryBlock[] | undefined): TheoryValidationError | null {
  if (!linkedTheory || linkedTheory.length === 0) {
    return {
      type: 'missing_theory_link',
      message: 'Exercise has no linked theory blocks',
    };
  }
  return null;
}

/**
 * Parameters for saving an exercise to the notebook
 */
export interface SaveExerciseParams {
  question: string;
  correctAnswer?: string;
  subtopicName: string;
  solutionSteps?: SolutionStep[];
  finalAnswer?: string;
  tip?: string;
  personalNote?: string;
}
