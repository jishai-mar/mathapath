// Exponential Equations Curriculum Model
// Defines the structured curriculum with prerequisites, learning objectives, and mastery criteria

export interface LearningObjective {
  id: string;
  description: string;
  skillLevel: 'foundational' | 'intermediate' | 'advanced';
}

export interface CurriculumTopic {
  id: string;
  name: string;
  description: string;
  prerequisites: string[]; // IDs of prerequisite topics
  learningObjectives: LearningObjective[];
  commonMistakes: string[];
  masteryDescription: string;
}

export interface StudentProfile {
  type: 'formal' | 'intuitive';
  name: string;
  description: string;
  explanationStyle: {
    useSymbols: boolean;
    stepByStep: boolean;
    useAnalogies: boolean;
    verboseReasoning: boolean;
  };
}

// Student profiles for personalized explanations
export const STUDENT_PROFILES: Record<string, StudentProfile> = {
  formal: {
    type: 'formal',
    name: 'Formal Learner',
    description: 'Prefers precise mathematical notation, step-by-step derivations, and symbolic manipulation',
    explanationStyle: {
      useSymbols: true,
      stepByStep: true,
      useAnalogies: false,
      verboseReasoning: false
    }
  },
  intuitive: {
    type: 'intuitive',
    name: 'Intuitive Learner',
    description: 'Prefers verbal explanations, real-world connections, and understanding "why" before "how"',
    explanationStyle: {
      useSymbols: false,
      stepByStep: false,
      useAnalogies: true,
      verboseReasoning: true
    }
  }
};

// The structured curriculum with explicit prerequisite relationships
export const EXPONENTIAL_CURRICULUM: CurriculumTopic[] = [
  {
    id: 'algebraic-manipulation',
    name: 'Basic Algebraic Manipulation',
    description: 'Foundation skills for manipulating algebraic expressions',
    prerequisites: [],
    learningObjectives: [
      {
        id: 'am-1',
        description: 'Simplify expressions by combining like terms',
        skillLevel: 'foundational'
      },
      {
        id: 'am-2',
        description: 'Factor and expand expressions correctly',
        skillLevel: 'foundational'
      },
      {
        id: 'am-3',
        description: 'Isolate variables in equations',
        skillLevel: 'foundational'
      }
    ],
    commonMistakes: [
      'Forgetting to distribute negative signs',
      'Incorrectly combining unlike terms',
      'Sign errors when moving terms across equals sign'
    ],
    masteryDescription: 'Can confidently manipulate algebraic expressions and isolate variables'
  },
  {
    id: 'simple-equations',
    name: 'Solving Simple Equations',
    description: 'Techniques for solving linear and basic polynomial equations',
    prerequisites: ['algebraic-manipulation'],
    learningObjectives: [
      {
        id: 'se-1',
        description: 'Solve linear equations in one variable',
        skillLevel: 'foundational'
      },
      {
        id: 'se-2',
        description: 'Verify solutions by substitution',
        skillLevel: 'foundational'
      },
      {
        id: 'se-3',
        description: 'Recognize when equations have no solution or infinite solutions',
        skillLevel: 'intermediate'
      }
    ],
    commonMistakes: [
      'Not performing same operation on both sides',
      'Forgetting to check solutions',
      'Division by zero errors'
    ],
    masteryDescription: 'Can solve and verify solutions to linear equations consistently'
  },
  {
    id: 'laws-of-exponents',
    name: 'Laws of Exponents',
    description: 'Core rules for manipulating exponential expressions',
    prerequisites: ['algebraic-manipulation'],
    learningObjectives: [
      {
        id: 'le-1',
        description: 'Apply the product rule: a^m · a^n = a^(m+n)',
        skillLevel: 'foundational'
      },
      {
        id: 'le-2',
        description: 'Apply the quotient rule: a^m / a^n = a^(m-n)',
        skillLevel: 'foundational'
      },
      {
        id: 'le-3',
        description: 'Apply the power rule: (a^m)^n = a^(mn)',
        skillLevel: 'foundational'
      },
      {
        id: 'le-4',
        description: 'Handle zero and negative exponents correctly',
        skillLevel: 'intermediate'
      },
      {
        id: 'le-5',
        description: 'Rewrite expressions using same base',
        skillLevel: 'intermediate'
      }
    ],
    commonMistakes: [
      'Confusing a^m · a^n with (a^m)^n',
      'Incorrectly handling negative exponents',
      'Thinking a^0 = 0 instead of 1',
      'Adding exponents when bases are different'
    ],
    masteryDescription: 'Can fluently apply all exponent rules and convert between different forms'
  },
  {
    id: 'logarithms-basics',
    name: 'Logarithms as Inverse Functions',
    description: 'Understanding logarithms as the inverse of exponentials',
    prerequisites: ['laws-of-exponents'],
    learningObjectives: [
      {
        id: 'lb-1',
        description: 'Convert between exponential and logarithmic form: a^x = y ⟺ log_a(y) = x',
        skillLevel: 'foundational'
      },
      {
        id: 'lb-2',
        description: 'Evaluate simple logarithms without a calculator',
        skillLevel: 'foundational'
      },
      {
        id: 'lb-3',
        description: 'Apply basic logarithm properties: log(ab), log(a/b), log(a^n)',
        skillLevel: 'intermediate'
      },
      {
        id: 'lb-4',
        description: 'Use change of base formula',
        skillLevel: 'intermediate'
      }
    ],
    commonMistakes: [
      'Confusing log_a(b) with log_b(a)',
      'Thinking log(a+b) = log(a) + log(b)',
      'Forgetting domain restrictions (argument must be positive)',
      'Incorrectly applying power rule of logs'
    ],
    masteryDescription: 'Can convert between exponential and log forms, and apply log properties correctly'
  },
  {
    id: 'exponential-equations',
    name: 'Exponential Equations',
    description: 'Solving equations where the variable appears in the exponent',
    prerequisites: ['laws-of-exponents', 'logarithms-basics', 'simple-equations'],
    learningObjectives: [
      {
        id: 'ee-1',
        description: 'Solve exponential equations with same base by equating exponents',
        skillLevel: 'foundational'
      },
      {
        id: 'ee-2',
        description: 'Rewrite bases to make them equal (e.g., 4^x = 8 as powers of 2)',
        skillLevel: 'intermediate'
      },
      {
        id: 'ee-3',
        description: 'Solve exponential equations using logarithms when bases cannot be matched',
        skillLevel: 'intermediate'
      },
      {
        id: 'ee-4',
        description: 'Handle equations with exponentials on both sides',
        skillLevel: 'advanced'
      },
      {
        id: 'ee-5',
        description: 'Solve equations involving e^x using natural logarithm',
        skillLevel: 'advanced'
      },
      {
        id: 'ee-6',
        description: 'Identify extraneous solutions and verify answers',
        skillLevel: 'advanced'
      }
    ],
    commonMistakes: [
      'Trying to "cancel" bases incorrectly',
      'Forgetting to check if answer makes the base positive',
      'Not recognizing when to use logarithms vs base-matching',
      'Errors in applying log to both sides',
      'Forgetting that a^x > 0 for all x (no negative results possible)'
    ],
    masteryDescription: 'A student can correctly solve exponential equations using exponent rules and logarithms, and justify each step.'
  }
];

// Get topic by ID
export function getTopic(topicId: string): CurriculumTopic | undefined {
  return EXPONENTIAL_CURRICULUM.find(t => t.id === topicId);
}

// Get all prerequisites (recursive) for a topic
export function getAllPrerequisites(topicId: string): string[] {
  const topic = getTopic(topicId);
  if (!topic) return [];
  
  const allPrereqs: Set<string> = new Set();
  const queue = [...topic.prerequisites];
  
  while (queue.length > 0) {
    const prereqId = queue.shift()!;
    if (!allPrereqs.has(prereqId)) {
      allPrereqs.add(prereqId);
      const prereqTopic = getTopic(prereqId);
      if (prereqTopic) {
        queue.push(...prereqTopic.prerequisites);
      }
    }
  }
  
  return Array.from(allPrereqs);
}

// Get the learning path to reach a topic
export function getLearningPath(targetTopicId: string): CurriculumTopic[] {
  const prereqs = getAllPrerequisites(targetTopicId);
  const targetTopic = getTopic(targetTopicId);
  
  // Sort by dependency order
  const orderedTopics: CurriculumTopic[] = [];
  const processed = new Set<string>();
  
  function addTopic(topicId: string) {
    if (processed.has(topicId)) return;
    const topic = getTopic(topicId);
    if (!topic) return;
    
    // First add all prerequisites
    topic.prerequisites.forEach(addTopic);
    
    processed.add(topicId);
    orderedTopics.push(topic);
  }
  
  prereqs.forEach(addTopic);
  if (targetTopic) {
    addTopic(targetTopicId);
  }
  
  return orderedTopics;
}

// Problem difficulty levels
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// Problem templates for dynamic generation
export interface ProblemTemplate {
  type: string;
  difficulty: DifficultyLevel;
  description: string;
  examplePattern: string;
  solutionStrategy: string;
}

export const EXPONENTIAL_PROBLEM_TEMPLATES: ProblemTemplate[] = [
  // Easy problems - same base, direct solving
  {
    type: 'same-base-direct',
    difficulty: 'easy',
    description: 'Same base on both sides, equate exponents directly',
    examplePattern: '2^x = 2^5 → x = 5',
    solutionStrategy: 'If a^m = a^n, then m = n (when a > 0, a ≠ 1)'
  },
  {
    type: 'same-base-simple',
    difficulty: 'easy',
    description: 'Same base with simple linear exponent',
    examplePattern: '3^(x+1) = 3^4 → x+1 = 4 → x = 3',
    solutionStrategy: 'Equate exponents and solve the resulting linear equation'
  },
  {
    type: 'power-of-same-base',
    difficulty: 'easy',
    description: 'One side is a power that can be rewritten',
    examplePattern: '2^x = 8 → 2^x = 2^3 → x = 3',
    solutionStrategy: 'Recognize common powers and rewrite to same base'
  },
  
  // Medium problems - rewriting bases, multiple steps
  {
    type: 'different-base-convertible',
    difficulty: 'medium',
    description: 'Different bases that can be converted to same base',
    examplePattern: '4^x = 8 → (2²)^x = 2³ → 2^(2x) = 2^3 → 2x = 3 → x = 3/2',
    solutionStrategy: 'Find common base, apply power rule, equate exponents'
  },
  {
    type: 'exponential-both-sides',
    difficulty: 'medium',
    description: 'Exponentials on both sides with same convertible base',
    examplePattern: '9^x = 27^(x-1) → 3^(2x) = 3^(3x-3) → 2x = 3x-3 → x = 3',
    solutionStrategy: 'Convert both sides to same base, equate and solve linear equation'
  },
  {
    type: 'product-with-exponential',
    difficulty: 'medium',
    description: 'Coefficient times exponential equals constant',
    examplePattern: '5·2^x = 40 → 2^x = 8 → 2^x = 2^3 → x = 3',
    solutionStrategy: 'Isolate the exponential term first, then solve'
  },
  
  // Hard problems - using logarithms, reasoning about solutions
  {
    type: 'log-required',
    difficulty: 'hard',
    description: 'Bases cannot be matched, logarithms required',
    examplePattern: '3^x = 5 → x = log_3(5) = ln(5)/ln(3)',
    solutionStrategy: 'Take logarithm of both sides, use change of base if needed'
  },
  {
    type: 'exponential-with-coefficients',
    difficulty: 'hard',
    description: 'Exponentials with different bases requiring logs',
    examplePattern: '2^x = 3^(x-1) → x·ln(2) = (x-1)·ln(3) → solve for x',
    solutionStrategy: 'Take ln of both sides, use log properties, isolate x'
  },
  {
    type: 'e-based-equation',
    difficulty: 'hard',
    description: 'Equations involving e^x',
    examplePattern: 'e^(2x) - 3e^x + 2 = 0 → (e^x - 1)(e^x - 2) = 0',
    solutionStrategy: 'Substitute u = e^x to get quadratic, solve, back-substitute'
  },
  {
    type: 'reasoning-solution-existence',
    difficulty: 'hard',
    description: 'Determine if solutions exist and find them',
    examplePattern: '2^x + 4^x = 5 → analyze using substitution',
    solutionStrategy: 'Use substitution u = 2^x, recognize constraints (u > 0)'
  }
];

// Readiness assessment criteria
export interface ReadinessLevel {
  level: 'not-ready' | 'almost-ready' | 'ready';
  description: string;
  feedbackTemplate: string;
  threshold: number; // percentage correct needed
}

export const READINESS_LEVELS: ReadinessLevel[] = [
  {
    level: 'not-ready',
    description: 'Not ready for exam yet',
    feedbackTemplate: 'You need more practice with the fundamentals. Focus on: {weakAreas}. Make sure you\'re comfortable with exponent rules before attempting harder problems.',
    threshold: 0
  },
  {
    level: 'almost-ready',
    description: 'Almost ready, focus on specific areas',
    feedbackTemplate: 'You\'re making good progress! You handle {strongAreas} well, but need more work on: {weakAreas}. Practice a few more problems involving logarithms.',
    threshold: 60
  },
  {
    level: 'ready',
    description: 'Ready for exam-level exponential equations',
    feedbackTemplate: 'Excellent work! You demonstrate solid understanding of exponential equations. You can confidently: {strongAreas}. You\'re ready for the exam!',
    threshold: 80
  }
];

export function assessReadiness(
  correctCount: number, 
  totalCount: number,
  performanceByDifficulty: Record<DifficultyLevel, { correct: number; total: number }>
): { level: ReadinessLevel; specificFeedback: string } {
  const percentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
  
  // Find appropriate level
  let readinessLevel = READINESS_LEVELS[0];
  for (const level of READINESS_LEVELS) {
    if (percentage >= level.threshold) {
      readinessLevel = level;
    }
  }
  
  // Determine strong and weak areas
  const strongAreas: string[] = [];
  const weakAreas: string[] = [];
  
  for (const [diff, stats] of Object.entries(performanceByDifficulty)) {
    const diffPercent = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    const diffName = diff === 'easy' ? 'basic exponential equations' :
                     diff === 'medium' ? 'base-rewriting problems' :
                     'logarithmic methods';
    
    if (diffPercent >= 70) {
      strongAreas.push(diffName);
    } else if (stats.total > 0) {
      weakAreas.push(diffName);
    }
  }
  
  let specificFeedback = readinessLevel.feedbackTemplate
    .replace('{strongAreas}', strongAreas.length > 0 ? strongAreas.join(', ') : 'fundamental concepts')
    .replace('{weakAreas}', weakAreas.length > 0 ? weakAreas.join(', ') : 'advanced techniques');
  
  return { level: readinessLevel, specificFeedback };
}
