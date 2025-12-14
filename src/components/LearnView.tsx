import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MathRenderer from './MathRenderer';
import TutorChat from './TutorChat';
import InteractiveMathGraph from './InteractiveMathGraph';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  PlayCircle, 
  MessageCircle,
  AlertTriangle
} from 'lucide-react';

interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
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

interface EnhancedTheoryContent {
  theory_explanation: string;
  worked_examples: WorkedExample[];
  key_concepts: string[];
  common_mistakes: CommonMistake[];
  visual_description: VisualDescription | null;
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
}: LearnViewProps) {
  const [showTutor, setShowTutor] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState<EnhancedTheoryContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);

  const displayTheory = enhancedContent?.theory_explanation || theoryExplanation;
  const displayExamples = enhancedContent?.worked_examples?.length ? enhancedContent.worked_examples : workedExamples;
  const commonMistakes = enhancedContent?.common_mistakes || [];
  const visualDescription = enhancedContent?.visual_description;

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
        body: { subtopicName, topicName, existingTheory: theoryExplanation, existingExamples: workedExamples }
      });
      if (error) throw error;
      if (data && !data.error) setEnhancedContent(data);
    } catch (error) {
      console.error('Error generating theory content:', error);
      toast.error('Could not load theory content.');
    } finally {
      setIsLoadingContent(false);
      setHasGeneratedContent(true);
    }
  };

  // Extract formula from theory
  const extractFormula = (text: string): string | null => {
    const match = text.match(/\*\*Formula:\*\*\s*(.+?)(?:\n|$)/i);
    if (match) return match[1].trim();
    const latexMatch = text.match(/\\frac\{[^}]+\}\{[^}]+\}|[a-z]\s*=\s*[^.\n]+/i);
    return latexMatch ? latexMatch[0] : null;
  };

  // Get clean explanation without formula line
  const getCleanExplanation = (text: string): string => {
    return text
      .replace(/\*\*Formula:\*\*\s*.+?(?:\n|$)/gi, '')
      .replace(/\*\*/g, '')
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 2)
      .join(' ');
  };

  const formula = displayTheory ? extractFormula(displayTheory) : null;
  const explanation = displayTheory ? getCleanExplanation(displayTheory) : '';

  if (isLoadingContent && !hasTheory) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Skeleton className="h-20 w-full mb-8" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Back button */}
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      )}

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-foreground mb-8"
      >
        {subtopicName}
      </motion.h1>

      {/* Core Concept */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10"
      >
        {explanation && (
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            <MathRenderer latex={explanation} />
          </p>
        )}

        {/* Formula Box */}
        {formula && (
          <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
            <div className="text-2xl text-foreground">
              <MathRenderer latex={formula} displayMode />
            </div>
          </div>
        )}
      </motion.section>

      {/* Graph - Only show if visual_description exists */}
      {visualDescription && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <InteractiveMathGraph concept={displayTheory || ''} subtopicName={subtopicName} />
        </motion.section>
      )}

      {/* Worked Example */}
      {hasExamples && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Example
          </h2>
          
          {displayExamples.slice(0, 1).map((example, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl p-6">
              {/* Problem */}
              <div className="text-lg text-foreground mb-6">
                <MathRenderer latex={example.problem} />
              </div>
              
              {/* Steps */}
              <div className="space-y-4">
                {example.steps.map((step, stepIdx) => {
                  const [action, rest] = step.split(':');
                  const [description, result] = (rest || '').split('→');
                  
                  return (
                    <motion.div
                      key={stepIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + stepIdx * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                        {stepIdx + 1}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{action?.trim()}</span>
                        {description && (
                          <span className="text-muted-foreground">: {description.trim()}</span>
                        )}
                        {result && (
                          <div className="mt-2 text-primary font-mono text-sm">
                            <MathRenderer latex={result.trim()} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Answer */}
              <div className="mt-6 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Answer: </span>
                <span className="text-foreground font-medium">
                  <MathRenderer latex={example.answer} />
                </span>
              </div>
            </div>
          ))}
        </motion.section>
      )}

      {/* Common Mistake */}
      {commonMistakes.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-destructive font-medium mb-1">
                <MathRenderer latex={commonMistakes[0].mistake} />
              </p>
              <p className="text-sm text-muted-foreground">
                <MathRenderer latex={commonMistakes[0].correction} />
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Ask Tutor */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-10"
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowTutor(!showTutor)}
        >
          <MessageCircle className="w-4 h-4" />
          {showTutor ? 'Hide Tutor' : 'Ask AI Tutor'}
        </Button>
        
        {showTutor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4"
          >
            <TutorChat subtopicName={subtopicName} theoryContext={displayTheory || ''} />
          </motion.div>
        )}
      </motion.section>

      {/* Start Practice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button onClick={onStartPractice} size="lg" className="w-full py-6 text-lg gap-2">
          <PlayCircle className="w-5 h-5" />
          Start Practice
        </Button>
      </motion.div>
    </div>
  );
}
