/**
 * Topic Mastery Test Types
 * Theory-first cumulative assessment for entire topics
 */

export interface TheoryCitedSolutionStep {
  stepNumber: number;
  action: string;
  calculation: string;
  theoryBlockId: string;
  theoryBlockReference: string;  // "T1", "M2", "A3"
  theoryCitation: string;        // "By Theorem T1 (Equal Bases Principle)"
}

export interface MasteryTestQuestion {
  id: string;
  questionNumber: number;
  question: string;
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subtopicId: string;
  subtopicName: string;
  // Theory-first requirements
  primaryMethodBlockId: string;
  primaryMethodBlockNumber: string;
  supportingTheoremIds: string[];
  supportingTheoremNumbers: string[];
  definitionIds: string[];
  definitionNumbers: string[];
  conceptsTested: string[];  // Human-readable: ["D1", "T1", "M1"]
  // Solution with theory citations
  solution: TheoryCitedSolutionStep[];
  // Combination question flag
  isCombinationQuestion: boolean;
  combinedSubtopics?: string[];
}

export interface TheoryBlockScore {
  blockId: string;
  blockNumber: string;
  blockType: string;
  title: string;
  correct: number;
  total: number;
  percentage: number;
  status: 'strong' | 'needs-review' | 'weak';
}

export interface SubtopicCoverage {
  subtopicId: string;
  subtopicName: string;
  correct: number;
  total: number;
}

export interface MasteryTestResult {
  overallPercentage: number;
  totalQuestions: number;
  correctCount: number;
  timeSpentMinutes: number;
  theoryBlockScores: TheoryBlockScore[];
  weakBlocks: TheoryBlockScore[];
  strongBlocks: TheoryBlockScore[];
  subtopicBreakdown: SubtopicCoverage[];
}

export interface MasteryTestData {
  id: string;
  topicId: string;
  topicName: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  timeSpentMinutes?: number;
  questions: MasteryTestQuestion[];
  answers: MasteryTestAnswer[];
}

export interface MasteryTestAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect?: boolean;
  timeSpentSeconds?: number;
}

export interface TheoryBlockForTest {
  id: string;
  blockNumber: string;
  blockType: string;
  title: string;
  content: Record<string, unknown>;
  latexContent?: string;
}

// Validation types
export interface TheoryValidationError {
  type: 'missing_theory_link' | 'missing_step_reference' | 'invalid_block_id' | 'no_combination_question';
  message: string;
  context?: Record<string, unknown>;
}

export function validateMasteryTestQuestion(
  question: MasteryTestQuestion,
  availableBlockIds: string[]
): TheoryValidationError | null {
  if (!question.primaryMethodBlockId) {
    return {
      type: 'missing_theory_link',
      message: `Question ${question.id} has no primary method block`
    };
  }

  if (!question.conceptsTested?.length) {
    return {
      type: 'missing_theory_link',
      message: `Question ${question.id} has no concepts tested`
    };
  }

  for (const step of question.solution) {
    if (!step.theoryBlockId || !step.theoryCitation) {
      return {
        type: 'missing_step_reference',
        message: `Question ${question.id} Step ${step.stepNumber} missing theory citation`
      };
    }
  }

  return null;
}

export function validateMasteryTest(
  questions: MasteryTestQuestion[],
  availableBlockIds: string[]
): TheoryValidationError | null {
  // Check each question
  for (const q of questions) {
    const error = validateMasteryTestQuestion(q, availableBlockIds);
    if (error) return error;
  }

  // Check for at least one combination question
  const combinationQuestions = questions.filter(q => q.isCombinationQuestion);
  if (combinationQuestions.length === 0) {
    return {
      type: 'no_combination_question',
      message: 'Test must include at least one combination question'
    };
  }

  return null;
}
