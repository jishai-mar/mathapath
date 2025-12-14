import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import MathRenderer from './MathRenderer';
import TutorChat from './TutorChat';
import AnimatedMathVideo, { generateAnimationSteps } from './AnimatedMathVideo';
import InteractiveTheoryContent from './InteractiveTheoryContent';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  BookOpen, 
  ChevronDown, 
  PlayCircle, 
  MessageCircle,
  CheckCircle2,
  Lightbulb,
  Video,
  AlertTriangle,
  Target,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Zap,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';

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
}

export default function LearnView({
  subtopicName,
  topicName = '',
  theoryExplanation,
  workedExamples,
  onStartPractice,
}: LearnViewProps) {
  const [expandedExample, setExpandedExample] = useState<number | null>(0);
  const [showTutor, setShowTutor] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [showMistakes, setShowMistakes] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  
  const [enhancedContent, setEnhancedContent] = useState<EnhancedTheoryContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);

  const displayTheory = enhancedContent?.theory_explanation || theoryExplanation;
  const displayExamples = enhancedContent?.worked_examples?.length ? enhancedContent.worked_examples : workedExamples;
  const keyConcepts = enhancedContent?.key_concepts || [];
  const commonMistakes = enhancedContent?.common_mistakes || [];
  const visualDescription = enhancedContent?.visual_description;
  const miniPractice = enhancedContent?.mini_practice || [];

  const toggleRevealAnswer = (idx: number) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

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
        toast.success('Theory content loaded!');
      }
    } catch (error) {
      console.error('Error generating theory content:', error);
      toast.error('Could not load enhanced theory content.');
    } finally {
      setIsLoadingContent(false);
      setHasGeneratedContent(true);
    }
  };

  const animationSteps = useMemo(() => {
    if (!hasTheory) return [];
    return generateAnimationSteps(
      subtopicName,
      displayTheory || '',
      hasExamples ? displayExamples[0] : undefined
    );
  }, [subtopicName, displayTheory, displayExamples, hasTheory, hasExamples]);

  if (isLoadingContent && !hasTheory) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card/50 border border-border/30 backdrop-blur-sm"
        >
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex items-center gap-2 text-primary pt-6">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Generating personalized theory content...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Concepts Section */}
      {keyConcepts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-primary/5 border border-primary/20 backdrop-blur-sm"
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
            <Target className="w-5 h-5 text-primary" />
            Key Concepts to Master
          </h3>
          <ul className="space-y-3">
            {keyConcepts.map((concept, idx) => (
              <motion.li 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground/90 text-sm leading-relaxed">
                  <MathRenderer latex={concept} />
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Animated Video Section */}
      {animationSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Collapsible open={showVideo} onOpenChange={setShowVideo}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors group">
                <span className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-foreground block">Watch Animation</span>
                    <span className="text-sm text-muted-foreground">{subtopicName}</span>
                  </div>
                </span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showVideo ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <AnimatedMathVideo
                title={subtopicName}
                steps={animationSteps}
              />
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      )}

      {/* Theory Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-2xl bg-card/50 border border-border/30 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <BookOpen className="w-5 h-5 text-primary" />
            Theory: {subtopicName}
          </h3>
          {!enhancedContent && hasTheory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={generateTheoryContent}
              disabled={isLoadingContent}
              className="text-muted-foreground hover:text-primary"
            >
              {isLoadingContent ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Enhance
                </>
              )}
            </Button>
          )}
        </div>
        
        {hasTheory ? (
          <InteractiveTheoryContent content={displayTheory!} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Theory content coming soon for this subtopic.</p>
            <p className="text-sm mt-1">You can start practicing right away!</p>
          </div>
        )}
      </motion.div>

      {/* Visual Description Section */}
      {visualDescription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-card/50 border border-border/30 backdrop-blur-sm"
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            Visual Representation
          </h3>
          <div className="p-4 rounded-xl bg-border/10 border border-border/30">
            <p className="text-sm text-foreground/80 mb-3">{visualDescription.description}</p>
            <div className="space-y-2">
              {visualDescription.key_points.map((point, idx) => (
                <p key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/50" />
                  {point}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Worked Examples Section */}
      {hasExamples && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-card/50 border border-border/30 backdrop-blur-sm"
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Worked Examples
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Step-by-step solutions with explanations
          </p>
          
          <div className="space-y-3">
            {displayExamples.map((example, idx) => (
              <Collapsible
                key={idx}
                open={expandedExample === idx}
                onOpenChange={() => setExpandedExample(expandedExample === idx ? null : idx)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-border/10 hover:bg-border/20 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-semibold">
                        {idx + 1}
                      </span>
                      <span className="text-left text-sm text-foreground">
                        <MathRenderer latex={example.problem} />
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedExample === idx ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 ml-11 space-y-3"
                  >
                    {example.steps.map((step, stepIdx) => (
                      <motion.div 
                        key={stepIdx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: stepIdx * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-xl bg-border/10 border-l-2 border-primary/30"
                      >
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-mono text-xs flex items-center justify-center flex-shrink-0">
                          {stepIdx + 1}
                        </span>
                        <div className="text-foreground/80 text-sm">
                          <MathRenderer latex={step} />
                        </div>
                      </motion.div>
                    ))}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                      <span className="font-semibold text-primary text-lg">
                        <MathRenderer latex={example.answer} />
                      </span>
                    </div>
                    {example.pro_tip && (
                      <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-accent">
                          <span className="font-semibold">Pro tip:</span> {example.pro_tip}
                        </p>
                      </div>
                    )}
                  </motion.div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </motion.div>
      )}

      {/* Mini Practice Section */}
      {miniPractice.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="p-6 rounded-2xl bg-accent/5 border border-accent/20 backdrop-blur-sm"
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
            <Zap className="w-5 h-5 text-accent" />
            Quick Practice
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Test your understanding with these quick exercises
          </p>
          
          <div className="grid gap-4">
            {miniPractice.map((practice, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl bg-card/50 border border-border/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        practice.difficulty === 'easy' 
                          ? 'bg-green-500/20 text-green-400' 
                          : practice.difficulty === 'medium' 
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {practice.difficulty}
                      </span>
                    </div>
                    <div className="text-foreground mb-3">
                      <MathRenderer latex={practice.question} />
                    </div>
                    
                    {practice.hint && (
                      <p className="text-xs text-muted-foreground mb-2">
                        💡 Hint: {practice.hint}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRevealAnswer(idx)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {revealedAnswers.has(idx) ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Hide Answer
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Show Answer
                      </>
                    )}
                  </Button>
                  
                  <AnimatePresence>
                    {revealedAnswers.has(idx) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="font-medium text-primary">
                          <MathRenderer latex={practice.answer} />
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Common Mistakes Section */}
      {commonMistakes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Collapsible open={showMistakes} onOpenChange={setShowMistakes}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-colors">
                <span className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <span className="font-semibold text-foreground">Common Mistakes to Avoid</span>
                </span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showMistakes ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-4">
                {commonMistakes.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-destructive font-bold">✗</span>
                      <p className="text-sm text-foreground/80">
                        <MathRenderer latex={item.mistake} />
                      </p>
                    </div>
                    <div className="flex items-start gap-2 ml-4">
                      <ChevronRight className="w-4 h-4 text-primary mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        <MathRenderer latex={item.correction} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      )}

      {/* Ask Tutor Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Collapsible open={showTutor} onOpenChange={setShowTutor}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/30 transition-colors group">
              <span className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground">Ask the tutor about this topic</span>
              </span>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showTutor ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <TutorChat 
              subtopicName={subtopicName}
              theoryContext={displayTheory || ''}
            />
          </CollapsibleContent>
        </Collapsible>
      </motion.div>

      {/* Start Practice Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={onStartPractice}
          size="lg"
          className="w-full py-7 text-lg font-semibold gap-3 shadow-primary-glow hover:shadow-primary-glow-lg transition-shadow"
        >
          <PlayCircle className="w-6 h-6" />
          Start Practice
        </Button>
      </motion.div>
    </div>
  );
}
