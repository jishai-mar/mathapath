/**
 * Type definitions for the Theory Page system
 */

export interface TheoryTopic {
  id: string;
  title: string;
  subtitle: string;
  breadcrumb: BreadcrumbItem[];
  blocks: TheoryBlock[];
  visualizer?: VisualizerConfig;
  nextTopicId?: string;
  nextTopicTitle?: string;
  practiceUrl?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type TheoryBlock = 
  | FormalDefinitionBlock
  | IntuitiveExplanationBlock
  | WorkedExampleBlock
  | DeepDiveBlock;

export interface FormalDefinitionBlock {
  type: 'formal-definition';
  content: string;
  formula?: string;
  note?: string;
}

export interface IntuitiveExplanationBlock {
  type: 'intuitive-explanation';
  title?: string;
  paragraphs: string[];
  metaphor?: string;
}

export interface WorkedExampleBlock {
  type: 'worked-example';
  title?: string;
  problem: string;
  steps: ExampleStep[];
  finalAnswer?: string;
}

export interface ExampleStep {
  explanation: string;
  math?: string;
  highlight?: boolean;
}

export interface DeepDiveBlock {
  type: 'deep-dive';
  questions: DeepDiveQuestion[];
}

export interface DeepDiveQuestion {
  question: string;
  answer: string;
}

export interface VisualizerConfig {
  type: 'graph' | 'interactive' | 'animation';
  title: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning';
  description?: string;
  controls?: VisualizerControl[];
  graphConfig?: GraphConfig;
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

export interface GraphConfig {
  function: string;
  domain: [number, number];
  range: [number, number];
  showGrid?: boolean;
  showAxis?: boolean;
  annotations?: GraphAnnotation[];
}

export interface GraphAnnotation {
  type: 'point' | 'line' | 'area' | 'label';
  x?: number;
  y?: number;
  label?: string;
  color?: string;
}
