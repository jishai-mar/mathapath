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
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

interface CommonMistake {
  wrong: string;
  right: string;
}

interface TheoryContent {
  definition: string;
  key_rule: string;
  formula: string;
  when_to_use: string;
  worked_example: WorkedExample;
  common_mistake: CommonMistake;
  needs_graph: boolean;
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
  const [content, setContent] = useState<TheoryContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const hasExistingContent = theoryExplanation && theoryExplanation.trim().length > 0;

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      generateContent();
    }
  }, [subtopicName]);

  const generateContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-theory-content', {
        body: { subtopicName, topicName, existingTheory: theoryExplanation, existingExamples: workedExamples }
      });
      if (error) throw error;
      if (data && !data.error) setContent(data);
    } catch (error) {
      console.error('Error generating theory:', error);
      toast.error('Could not load theory content.');
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back button */}
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      )}

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-foreground mb-10"
      >
        {subtopicName}
      </motion.h1>

      {/* Definition */}
      {content?.definition && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Definition</span>
          <p className="mt-2 text-xl font-semibold text-foreground leading-relaxed">
            <MathRenderer latex={content.definition} />
          </p>
        </motion.section>
      )}

      {/* Key Rule */}
      {content?.key_rule && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 p-5 rounded-xl bg-primary/10 border border-primary/20">
            <Lightbulb className="w-6 h-6 text-primary flex-shrink-0" />
            <p className="text-xl font-semibold text-primary">
              <MathRenderer latex={content.key_rule} />
            </p>
          </div>
        </motion.section>
      )}

      {/* Formula */}
      {content?.formula && (
        <motion.section
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <motion.div 
            className="relative bg-card border border-primary/30 rounded-xl p-8 text-center overflow-hidden"
            initial={{ boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" }}
            animate={{ 
              boxShadow: [
                "0 0 0 0 hsl(var(--primary) / 0)",
                "0 0 30px 5px hsl(var(--primary) / 0.15)",
                "0 0 20px 2px hsl(var(--primary) / 0.1)"
              ]
            }}
            transition={{ delay: 0.4, duration: 1.5, ease: "easeOut" }}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
            
            <motion.div 
              className="relative text-3xl text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <MathRenderer latex={content.formula} displayMode />
            </motion.div>
          </motion.div>
          {content.when_to_use && (
            <motion.p 
              className="text-sm text-muted-foreground mt-3 text-center italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {content.when_to_use}
            </motion.p>
          )}
        </motion.section>
      )}

      {/* Graph */}
      {content?.needs_graph && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <InteractiveMathGraph concept={content.definition || ''} subtopicName={subtopicName} />
        </motion.section>
      )}

      {/* Worked Example */}
      {content?.worked_example && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Example</span>
          
          <div className="mt-3 bg-card border border-border rounded-xl p-6">
            {/* Problem */}
            <div className="text-lg font-medium text-foreground mb-5">
              <MathRenderer latex={content.worked_example.problem} />
            </div>
            
            {/* Steps */}
            <div className="space-y-3">
              {content.worked_example.steps.map((step, idx) => {
                const parts = step.split('→');
                const action = parts[0]?.trim();
                const result = parts[1]?.trim();
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                      {idx + 1}
                    </span>
                    <div className="flex-1 flex items-center gap-2 text-foreground">
                      <span><MathRenderer latex={action} /></span>
                      {result && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-primary font-medium">
                            <MathRenderer latex={result} />
                          </span>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Answer */}
            <div className="mt-5 pt-4 border-t border-border flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Answer:</span>
              <span className="text-lg font-semibold text-foreground">
                <MathRenderer latex={content.worked_example.answer} />
              </span>
            </div>
          </div>
        </motion.section>
      )}

      {/* Common Mistake */}
      {content?.common_mistake && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="text-destructive font-medium">Don't: </span>
              <span className="text-muted-foreground">{content.common_mistake.wrong}</span>
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="text-foreground font-medium">Do: </span>
              <span className="text-muted-foreground">{content.common_mistake.right}</span>
            </div>
          </div>
        </motion.section>
      )}

      {/* Ask Tutor */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
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
            <TutorChat subtopicName={subtopicName} theoryContext={content?.definition || ''} />
          </motion.div>
        )}
      </motion.section>

      {/* Start Practice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Button onClick={onStartPractice} size="lg" className="w-full py-6 text-lg gap-2">
          <PlayCircle className="w-5 h-5" />
          Start Practice
        </Button>
      </motion.div>
    </div>
  );
}
