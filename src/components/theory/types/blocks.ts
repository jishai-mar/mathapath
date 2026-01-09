/**
 * Theory Block Type Definitions
 * These types define the structure for rigorous mathematical theory content
 */

// Base interface for all theory blocks
export interface BaseTheoryBlock {
  id: string;
  topicId: string;
  blockNumber: string; // e.g., "D1", "T2", "M1" for referencing
  orderIndex: number;
  title: string;
  prerequisites?: string[];
}

// Formal definition block - defines mathematical terms rigorously
export interface DefinitionBlock extends BaseTheoryBlock {
  type: 'definition';
  content: {
    term: string;
    notation: string;        // LaTeX notation for the concept
    formalStatement: string; // Rigorous definition text
    domain?: string;         // Domain restrictions (e.g., "x ∈ ℝ, x ≠ 0")
    examples: string[];      // Illustrative examples
    counterexamples?: string[];
    remarks?: string[];
  };
}

// Theorem block with optional proof
export interface TheoremBlock extends BaseTheoryBlock {
  type: 'theorem';
  content: {
    name: string;
    hypothesis: string;      // "If..." conditions
    conclusion: string;      // "Then..." result
    formalStatement: string; // Combined formal statement in LaTeX
    proof?: ProofStep[];
    intuition: string;       // Why it works (conceptual explanation)
    applications: string[];
  };
}

export interface ProofStep {
  stepNumber: number;
  statement: string;
  justification: string;
  referencedBlocks?: string[]; // Block numbers like "D1", "T2"
}

// Property block - mathematical properties that follow from definitions
export interface PropertyBlock extends BaseTheoryBlock {
  type: 'property';
  content: {
    name: string;
    statement: string;
    derivation?: string;     // How it follows from definitions
    examples: string[];
    referencedBlocks?: string[];
  };
}

// Method/Algorithm block - step-by-step procedures
export interface MethodBlock extends BaseTheoryBlock {
  type: 'method';
  content: {
    name: string;
    applicableWhen: string;  // When to use this method
    steps: MethodStep[];
    warnings?: string[];     // Common mistakes to avoid
    examples?: string[];
  };
}

export interface MethodStep {
  stepNumber: number;
  action: string;
  mathExpression?: string;
  justifiedBy: string;       // Reference to theorem/definition that justifies this step
}

// Visual block with explicit algebraic connection
export interface VisualBlock extends BaseTheoryBlock {
  type: 'visual';
  content: {
    description: string;
    graphConfig: VisualGraphConfig;
    algebraicInterpretation: string; // How graph relates to formula
    keyObservations: string[];
    annotations?: GraphAnnotation[];
  };
}

export interface VisualGraphConfig {
  type: 'function' | 'parametric' | 'implicit' | 'geometric';
  functions?: FunctionConfig[];
  domain: [number, number];
  range: [number, number];
  showGrid?: boolean;
  showAxis?: boolean;
  controls?: VisualizerControl[];
}

export interface FunctionConfig {
  expression: string;
  label?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface VisualizerControl {
  id: string;
  label: string;
  symbol?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface GraphAnnotation {
  type: 'point' | 'line' | 'area' | 'label' | 'asymptote';
  x?: number;
  y?: number;
  label?: string;
  color?: string;
}

// Worked example with theory citations
export interface WorkedExampleBlock extends BaseTheoryBlock {
  type: 'worked-example';
  content: {
    problem: string;
    difficulty: 'basic' | 'intermediate' | 'advanced';
    conceptsApplied: string[];  // Block numbers of definitions/theorems used
    solution: SolutionStep[];
    verification?: string;      // How to check the answer
    commonErrors?: string[];
  };
}

export interface SolutionStep {
  stepNumber: number;
  action: string;
  calculation: string;
  justification: string;        // Explicit reference: "By Definition D1..."
  theoryBlockReference?: string; // Block number like "D1", "T2"
}

// Proof block - standalone proof of a theorem
export interface ProofBlock extends BaseTheoryBlock {
  type: 'proof';
  content: {
    theoremReference: string;   // Block number of the theorem being proved
    proofType: 'direct' | 'contradiction' | 'induction' | 'construction';
    steps: ProofStep[];
    conclusion: string;
  };
}

// Remark block - additional notes and observations
export interface RemarkBlock extends BaseTheoryBlock {
  type: 'remark';
  content: {
    text: string;
    relatedBlocks?: string[];
    importance: 'note' | 'warning' | 'tip';
  };
}

// Common mistake block - typical errors students make
export interface CommonMistakeBlock extends BaseTheoryBlock {
  type: 'common-mistake';
  content: {
    mistakeTitle: string;
    incorrectReasoning: string;
    whyWrong: string;
    correction: string;
    miniExample?: {
      wrong: string;
      right: string;
    };
  };
}

// Deep dive block - advanced exploration
export interface DeepDiveBlock extends BaseTheoryBlock {
  type: 'deep-dive';
  content: {
    question: string;
    answerExplanation: string;
    boundaryCases?: string[];
    extension?: string;
  };
}

// Topic overview block - comprehensive guide for a topic
export interface TopicOverviewBlock extends BaseTheoryBlock {
  type: 'topic-overview';
  content: {
    introduction?: string;
    sections: {
      heading: string;
      content: string[];
      examples?: {
        problem: string;
        steps: string[];
        result?: string;
      }[];
      rules?: string[];
      mistakes?: {
        mistake: string;
        why: string;
      }[];
    }[];
  };
}

// Union type for all theory blocks
export type TheoryBlockData = 
  | DefinitionBlock 
  | TheoremBlock 
  | PropertyBlock
  | MethodBlock 
  | VisualBlock 
  | WorkedExampleBlock
  | ProofBlock
  | RemarkBlock
  | CommonMistakeBlock
  | DeepDiveBlock
  | TopicOverviewBlock;

// Database row type (matches Supabase table structure)
export interface TheoryBlockRow {
  id: string;
  topic_id: string;
  block_type: TheoryBlockData['type'];
  block_number: string | null;
  order_index: number;
  title: string;
  content: Record<string, unknown>;
  latex_content: string | null;
  prerequisites: string[] | null;
  created_at: string;
}

// Exercise-theory link type
export interface ExerciseTheoryLink {
  id: string;
  exercise_id: string;
  theory_block_id: string;
  relevance: 'primary' | 'secondary' | 'reference';
  created_at: string;
  theory_blocks?: TheoryBlockRow;
}

// Helper function to convert database row to typed block
export function parseTheoryBlock(row: TheoryBlockRow): TheoryBlockData {
  const base = {
    id: row.id,
    topicId: row.topic_id,
    blockNumber: row.block_number || '',
    orderIndex: row.order_index,
    title: row.title,
    prerequisites: row.prerequisites || [],
  };

  return {
    ...base,
    type: row.block_type,
    content: row.content,
  } as TheoryBlockData;
}
