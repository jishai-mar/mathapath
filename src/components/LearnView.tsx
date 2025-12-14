import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MathRenderer from './MathRenderer';
import TutorChat from './TutorChat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  PlayCircle, 
  MessageCircle,
  Sparkles,
  BookOpen,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import InteractiveMathGraph from './InteractiveMathGraph';

interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
  pro_tip?: string;
}

interface CommonMistake {
  mistake: string;
  correction: string;
}

interface VisualDescription {
  type: 'graph' | 'diagram' | 'number_line' | 'coordinate_plane';
  description: string;
  key_points: string[];
}

interface MiniPractice {
  question: string;
  hint: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface EnhancedTheoryContent {
  theory_explanation: string;
  worked_examples: WorkedExample[];
  key_concepts: string[];
  common_mistakes: CommonMistake[];
  visual_description: VisualDescription | null;
  mini_practice?: MiniPractice[];
}

interface LearnViewProps {
  subtopicName: string;
  topicName?: string;
  theoryExplanation: string | null;
  workedExamples: WorkedExample[];
  onStartPractice: () => void;
  onBack?: () => void;
  nextSubtopic?: { name: string; id: string } | null;
  onNextSubtopic?: (id: string) => void;
}

export default function LearnView({
  subtopicName,
  topicName = '',
  theoryExplanation,
  workedExamples,
  onStartPractice,
  onBack,
  nextSubtopic,
  onNextSubtopic,
}: LearnViewProps) {
  const [showTutor, setShowTutor] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState<EnhancedTheoryContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);

  const displayTheory = enhancedContent?.theory_explanation || theoryExplanation;
  const displayExamples = enhancedContent?.worked_examples?.length ? enhancedContent.worked_examples : workedExamples;
  const keyConcepts = enhancedContent?.key_concepts || [];
  const commonMistakes = enhancedContent?.common_mistakes || [];

  const hasTheory = displayTheory && displayTheory.trim().length > 0;
  const hasExamples = displayExamples && displayExamples.length > 0;

  useEffect(() => {
    const shouldGenerate = !hasTheory && !hasExamples && !hasGeneratedContent && !isLoadingContent;
    if (shouldGenerate) {
      generateTheoryContent();
    }
  }, [subtopicName, hasTheory, hasExamples, hasGeneratedContent, isLoadingContent]);

  const generateTheoryContent = async () => {
    setIsLoadingContent(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-theory-content', {
        body: {
          subtopicName,
          topicName,
          existingTheory: theoryExplanation,
          existingExamples: workedExamples,
        }
      });

      if (error) throw error;
      if (data && !data.error) {
        setEnhancedContent(data);
      }
    } catch (error) {
      console.error('Error generating theory content:', error);
      toast.error('Could not load theory content.');
    } finally {
      setIsLoadingContent(false);
      setHasGeneratedContent(true);
    }
  };

  // Parse the main formula from theory (looks for patterns like "General Form:" or formulas)
  const extractMainFormula = (text: string): string | null => {
    const formulaPatterns = [
      /general\s*form[:\s]*([^\n]+)/i,
      /formula[:\s]*([^\n]+)/i,
      /\\frac\{[^}]+\}\{[^}]+\}/,
    ];
    for (const pattern of formulaPatterns) {
      const match = text.match(pattern);
      if (match) return match[1] || match[0];
    }
    return null;
  };

  // Extract first paragraph as intro
  const getIntroText = (text: string): string => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    return paragraphs[0] || '';
  };

  // Extract key principle
  const getKeyPrinciple = (text: string): { title: string; content: string } | null => {
    // Look for bold headers or key sections
    const match = text.match(/\*\*([^*]+)\*\*[:\s]*([^*\n]+(?:\n(?!\*\*)[^\n]+)*)/);
    if (match) {
      return { title: match[1], content: match[2].trim() };
    }
    if (keyConcepts.length > 0) {
      return { title: 'The Fundamental Principle', content: keyConcepts[0] };
    }
    return null;
  };

  const mainFormula = displayTheory ? extractMainFormula(displayTheory) : null;
  const introText = displayTheory ? getIntroText(displayTheory) : '';
  const keyPrinciple = displayTheory ? getKeyPrinciple(displayTheory) : null;

  if (isLoadingContent && !hasTheory) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-primary mb-8">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Generating lesson content...</span>
        </div>
        <Skeleton className="h-12 w-2/3 mb-4" />
        <Skeleton className="h-6 w-full mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Topics</span>
          </button>
        )}
      </div>

      {/* Title Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 text-primary mb-3">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium tracking-wider uppercase">AI Concept Explanation</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
          {subtopicName}
        </h1>
        {introText && (
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            <MathRenderer latex={introText.replace(/\*\*/g, '').slice(0, 150)} />
          </p>
        )}
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content - Left */}
        <div className="lg:col-span-2 space-y-8">
          {/* Fundamental Principle Card */}
          {keyPrinciple && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{keyPrinciple.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                <MathRenderer latex={keyPrinciple.content} />
              </p>

              {/* Formula Box */}
              {mainFormula && (
                <div className="bg-muted/30 rounded-xl p-6 text-center">
                  <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-4 block">
                    General Form
                  </span>
                  <div className="text-2xl text-foreground">
                    <MathRenderer latex={mainFormula} displayMode />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Process Breakdown */}
          {hasExamples && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-6">
                Process Breakdown
              </h3>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-8 bottom-8 w-px bg-border/50" />
                
                <div className="space-y-6">
                  {displayExamples.slice(0, 1).map((example, exIdx) => (
                    example.steps.map((step, stepIdx) => (
                      <motion.div
                        key={`${exIdx}-${stepIdx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + stepIdx * 0.1 }}
                        className="relative pl-8"
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-muted border-2 border-border" />
                        
                        <div className="p-5 rounded-xl bg-card border border-border/50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-foreground">
                              {stepIdx + 1}. {getStepTitle(step)}
                            </h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              Step {String(stepIdx + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {getStepDescription(step)}
                          </p>
                          
                          {/* Math expression */}
                          <div className="bg-muted/30 rounded-lg p-3 font-mono text-sm">
                            <span className="text-primary">
                              <MathRenderer latex={getStepMath(step)} />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar - Right */}
        <div className="space-y-6">
          {/* Interactive Graph Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <InteractiveMathGraph 
              concept={displayTheory || ''} 
              subtopicName={subtopicName} 
            />
          </motion.div>

          {/* AI Pro Tip */}
          {commonMistakes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-primary text-sm">AI Pro Tip</h4>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                <span className="font-medium">Common Mistake: </span>
                <MathRenderer latex={commonMistakes[0].mistake} />
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <MathRenderer latex={commonMistakes[0].correction} />
              </p>
            </motion.div>
          )}

          {/* Next Subtopic */}
          {nextSubtopic && onNextSubtopic && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-3 block">
                Next Subtopic
              </span>
              <button
                onClick={() => onNextSubtopic(nextSubtopic.id)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                    2
                  </span>
                  <span className="font-medium text-foreground">{nextSubtopic.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </motion.div>
          )}

          {/* Ask Tutor Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => setShowTutor(!showTutor)}
            >
              <MessageCircle className="w-4 h-4" />
              Ask the AI Tutor
            </Button>
            
            {showTutor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <TutorChat 
                  subtopicName={subtopicName}
                  theoryContext={displayTheory || ''}
                />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Start Practice Button - Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12"
      >
        <Button
          onClick={onStartPractice}
          size="lg"
          className="w-full max-w-md mx-auto flex py-6 text-lg font-semibold gap-3"
        >
          <PlayCircle className="w-5 h-5" />
          Start Practice
        </Button>
      </motion.div>
    </div>
  );
}

// Helper functions to parse step content
function getStepTitle(step: string): string {
  // Extract a title from the step (first few words or before colon)
  const colonIndex = step.indexOf(':');
  if (colonIndex > 0 && colonIndex < 50) {
    return step.slice(0, colonIndex);
  }
  // Get first 4-5 words as title
  const words = step.split(' ').slice(0, 5);
  return words.join(' ').replace(/[.,]$/, '');
}

function getStepDescription(step: string): string {
  // Get the descriptive part of the step
  const colonIndex = step.indexOf(':');
  if (colonIndex > 0) {
    return step.slice(colonIndex + 1).trim().split(/[=→]/).slice(0, 1).join('');
  }
  return step.replace(/\\[a-z]+\{[^}]+\}/g, '').slice(0, 100);
}

function getStepMath(step: string): string {
  // Extract math expressions from the step
  const mathPatterns = [
    /(\d+[x]?\s*[+\-*/=]\s*\d+[x]?\s*[+\-*/=]?\s*\d*)/g,
    /(\\frac\{[^}]+\}\{[^}]+\})/g,
    /([a-z]\s*=\s*\d+)/gi,
  ];
  
  for (const pattern of mathPatterns) {
    const match = step.match(pattern);
    if (match) return match[0];
  }
  
  // Return the step with minimal cleanup
  if (step.includes('→')) {
    return step.split('→').slice(-1)[0].trim();
  }
  return step.slice(-30);
}