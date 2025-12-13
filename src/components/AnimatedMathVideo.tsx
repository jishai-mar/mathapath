import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import MathRenderer from './MathRenderer';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Volume2,
  VolumeX
} from 'lucide-react';

export interface AnimationStep {
  type: 'title' | 'text' | 'equation' | 'highlight' | 'transition';
  content: string;
  duration?: number; // in milliseconds
  highlight?: string; // part to highlight
  voiceover?: string; // text for accessibility/screen readers
}

interface AnimatedMathVideoProps {
  title: string;
  steps: AnimationStep[];
  onComplete?: () => void;
}

const DEFAULT_DURATION = 4000; // Slower pace like a teacher explaining

export default function AnimatedMathVideo({ 
  title, 
  steps,
  onComplete 
}: AnimatedMathVideoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVoiceover, setShowVoiceover] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  const goToNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    } else {
      setIsPlaying(false);
      onComplete?.();
    }
  }, [currentStep, steps.length, onComplete]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setCompletedSteps(prev => prev.filter(s => s < currentStep - 1));
    }
  }, [currentStep]);

  const restart = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(true);
  }, []);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;

    const currentStepData = steps[currentStep];
    const duration = currentStepData?.duration || DEFAULT_DURATION;

    const timer = setTimeout(() => {
      goToNextStep();
    }, duration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, steps, goToNextStep]);

  const currentStepData = steps[currentStep];

  const renderStepContent = (step: AnimationStep) => {
    // Slower, more deliberate animations like a teacher writing on a board
    const variants = {
      hidden: { opacity: 0, y: 30, scale: 0.9 },
      visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
          duration: 0.8,
          ease: "easeOut" as const
        }
      },
      exit: { 
        opacity: 0, 
        y: -15,
        transition: { duration: 0.4 }
      }
    };

    const highlightVariants = {
      initial: { backgroundColor: 'transparent', boxShadow: 'none' },
      highlight: { 
        backgroundColor: 'hsl(var(--primary) / 0.15)',
        boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
        transition: { 
          duration: 0.8, 
          repeat: 3, 
          repeatType: 'reverse' as const
        }
      }
    };

    // Typewriter-like text reveal for key content
    const textRevealVariants = {
      hidden: { opacity: 0 },
      visible: (i: number) => ({
        opacity: 1,
        transition: { delay: i * 0.03 }
      })
    };

    switch (step.type) {
      case 'title':
        return (
          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center"
          >
            <motion.h3 
              className="text-2xl font-bold gradient-text"
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {step.content}
            </motion.h3>
            <motion.div 
              className="w-24 h-1 bg-primary/50 mx-auto mt-3 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </motion.div>
        );
      
      case 'text':
        return (
          <motion.div 
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-2"
          >
            <motion.p 
              className="text-base text-foreground/90 leading-relaxed"
            >
              <MathRenderer latex={step.content} />
            </motion.p>
            {/* Subtle indicator showing this is being "spoken" */}
            <motion.div 
              className="flex items-center gap-1 justify-center mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/40"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        );
      
      case 'equation':
        return (
          <motion.div 
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex justify-center py-6"
          >
            <motion.div
              variants={step.highlight ? highlightVariants : undefined}
              initial="initial"
              animate={step.highlight ? "highlight" : "initial"}
              className="relative px-8 py-6 rounded-xl bg-secondary/40 border-2 border-primary/30"
            >
              {/* Chalk-like writing effect */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <span className="text-2xl font-medium">
                  <MathRenderer latex={step.content} displayMode />
                </span>
              </motion.div>
              {/* Underline emphasis */}
              <motion.div 
                className="absolute bottom-2 left-1/2 -translate-x-1/2 h-0.5 bg-primary/50 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ delay: 1, duration: 0.5 }}
              />
            </motion.div>
          </motion.div>
        );
      
      case 'highlight':
        return (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.6 }}
            className="flex items-start gap-4 p-5 rounded-xl bg-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"
            >
              <motion.span 
                className="text-primary font-bold text-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                💡
              </motion.span>
            </motion.div>
            <div className="text-sm text-foreground leading-relaxed pt-1">
              <MathRenderer latex={step.content} />
            </div>
          </motion.div>
        );
      
      case 'transition':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-10 gap-4"
          >
            {/* Animated thinking dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-primary/60"
                  animate={{ 
                    y: [-5, 5, -5],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{ 
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
            <motion.p 
              className="text-xs text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Moving to the next concept...
            </motion.p>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-gradient-to-b from-card to-card/80 overflow-hidden">
      <CardContent className="p-0">
        {/* Video Header */}
        <div className="px-4 py-3 border-b border-border/50 bg-secondary/20">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              📹 Animated Explanation
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceover(!showVoiceover)}
              className="text-muted-foreground h-7 px-2"
            >
              {showVoiceover ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Video Content Area */}
        <div className="relative min-h-[200px] p-6 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <div key={currentStep}>
              {currentStepData && renderStepContent(currentStepData)}
            </div>
          </AnimatePresence>

          {/* Voiceover/Accessibility text */}
          {showVoiceover && currentStepData?.voiceover && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-xs text-muted-foreground text-center italic"
            >
              {currentStepData.voiceover}
            </motion.p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="px-4">
          <Progress value={progress} className="h-1" />
        </div>

        {/* Controls */}
        <div className="px-4 py-3 flex items-center justify-between bg-secondary/10">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextStep}
              disabled={currentStep >= steps.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={restart}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <span className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate animation steps from theory content
// Creates a structured, pedagogical video explanation like a teacher at a board
export function generateAnimationSteps(
  subtopicName: string,
  theoryExplanation: string,
  workedExample?: { problem: string; steps: string[]; answer: string }
): AnimationStep[] {
  const animationSteps: AnimationStep[] = [];

  // ===== PART 1: Welcome & Set Context =====
  animationSteps.push({
    type: 'title',
    content: subtopicName,
    duration: 3500,
    voiceover: `Welcome. Today we are going to learn about ${subtopicName}. Take your time with each step.`
  });

  animationSteps.push({
    type: 'text',
    content: `Let's build understanding step by step. There's no rush — the goal is to truly understand, not just memorize.`,
    duration: 4500,
    voiceover: `We will build understanding step by step. The goal is to truly understand this concept.`
  });

  // ===== PART 2: Theory Explanation =====
  if (theoryExplanation) {
    animationSteps.push({
      type: 'transition',
      content: '',
      duration: 2000
    });

    animationSteps.push({
      type: 'title',
      content: 'The Core Concept',
      duration: 3000,
      voiceover: `Let's start with the core concept. What is ${subtopicName} and why does it matter?`
    });

    // Parse theory into meaningful chunks
    const paragraphs = theoryExplanation.split('\n\n').filter(p => p.trim());
    
    paragraphs.forEach((paragraph) => {
      const cleanParagraph = paragraph.replace(/\*\*/g, '');
      
      // Key definitions and important concepts - give extra time
      if (paragraph.includes('**') || 
          paragraph.toLowerCase().includes('definition') ||
          paragraph.toLowerCase().includes('key idea') ||
          paragraph.toLowerCase().includes('important') ||
          paragraph.toLowerCase().includes('remember')) {
        animationSteps.push({
          type: 'highlight',
          content: cleanParagraph,
          duration: 6000, // Longer for key concepts
          voiceover: `This is important. ${cleanParagraph}`
        });
      } 
      // Formulas and equations - highlight and give time to absorb
      else if (paragraph.match(/[=<>≤≥±×÷]/) || paragraph.includes('\\frac') || paragraph.includes('\\sqrt')) {
        animationSteps.push({
          type: 'equation',
          content: cleanParagraph,
          duration: 5500, // Extra time for equations
          highlight: 'true',
          voiceover: `Here is an important formula. ${cleanParagraph}`
        });
      }
      // Numbered steps or rules
      else if (paragraph.match(/^\d\.|^Step \d|^Rule \d/i)) {
        animationSteps.push({
          type: 'text',
          content: cleanParagraph,
          duration: 5000,
          voiceover: cleanParagraph
        });
      }
      // Regular explanatory text - slower reading pace
      else {
        const wordCount = cleanParagraph.split(/\s+/).length;
        const baseDuration = 4000;
        const perWordDuration = 100; // Slower pace: ~100ms per word
        const duration = Math.min(baseDuration + (wordCount * perWordDuration), 10000);
        
        animationSteps.push({
          type: 'text',
          content: cleanParagraph,
          duration,
          voiceover: cleanParagraph
        });
      }
    });
  }

  // ===== PART 3: Key Insight =====
  animationSteps.push({
    type: 'transition',
    content: '',
    duration: 2500
  });

  animationSteps.push({
    type: 'highlight',
    content: `💡 The key insight: Understanding ${subtopicName} means knowing WHY each step works, not just memorizing procedures.`,
    duration: 5500,
    voiceover: `The key insight is understanding why each step works. This is what separates real understanding from memorization.`
  });

  // ===== PART 4: Worked Example =====
  if (workedExample) {
    animationSteps.push({
      type: 'transition',
      content: '',
      duration: 2500
    });

    animationSteps.push({
      type: 'title',
      content: 'Worked Example',
      duration: 3500,
      voiceover: `Now let's work through an example together. Watch each step carefully and think about why we take it.`
    });

    // Show the problem with context
    animationSteps.push({
      type: 'text',
      content: 'Let us look at this problem together:',
      duration: 3000,
      voiceover: `Let's look at this problem together.`
    });

    animationSteps.push({
      type: 'equation',
      content: workedExample.problem,
      duration: 5500,
      highlight: 'true',
      voiceover: `Our problem is: ${workedExample.problem}. Take a moment to read it and think about what we need to find.`
    });

    animationSteps.push({
      type: 'text',
      content: 'Before solving, let us think: What are we being asked to find? What information do we have?',
      duration: 4500,
      voiceover: `Before we start solving, let's think. What are we being asked to find? What information do we have?`
    });

    // Walk through each step with deliberate pacing
    animationSteps.push({
      type: 'transition',
      content: '',
      duration: 2000
    });

    animationSteps.push({
      type: 'title',
      content: 'Step-by-Step Solution',
      duration: 3000,
      voiceover: `Now, let's solve this step by step. Pay attention to why we do each step.`
    });

    workedExample.steps.forEach((step, idx) => {
      // Transition between steps
      if (idx > 0) {
        animationSteps.push({
          type: 'transition',
          content: '',
          duration: 1500
        });
      }

      animationSteps.push({
        type: 'text',
        content: `Step ${idx + 1}: ${step}`,
        duration: 6000, // Longer duration for each step
        voiceover: `Step ${idx + 1}: ${step}. Pause here if you need to think about why this step makes sense.`
      });
    });

    // Show the final answer with emphasis
    animationSteps.push({
      type: 'transition',
      content: '',
      duration: 2000
    });

    animationSteps.push({
      type: 'highlight',
      content: `✓ Answer: ${workedExample.answer}`,
      duration: 5000,
      voiceover: `And our final answer is: ${workedExample.answer}. This is what we were looking for.`
    });

    // Reflection
    animationSteps.push({
      type: 'text',
      content: 'Notice how we followed a logical sequence: we identified what we needed, applied the right steps in order, and verified our answer.',
      duration: 6000,
      voiceover: `Notice the pattern: we identified what we needed, applied the right steps in order, and arrived at the answer. This approach works for all similar problems.`
    });
  }

  // ===== PART 5: Summary & Encouragement =====
  animationSteps.push({
    type: 'transition',
    content: '',
    duration: 2500
  });

  animationSteps.push({
    type: 'title',
    content: 'Ready to Practice',
    duration: 3500,
    voiceover: `Well done. You now understand the fundamentals of ${subtopicName}.`
  });

  animationSteps.push({
    type: 'highlight',
    content: `📝 Now it is your turn. Start with easier problems and work your way up. Remember: making mistakes is how we learn — each one brings you closer to understanding.`,
    duration: 6000,
    voiceover: `Now it's your turn to practice. Start with easier problems, and don't worry about mistakes. Each mistake brings you closer to understanding.`
  });

  return animationSteps;
}
