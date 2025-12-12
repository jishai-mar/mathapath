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

const DEFAULT_DURATION = 3000;

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
    const variants = {
      hidden: { opacity: 0, y: 20, scale: 0.95 },
      visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
          duration: 0.6, 
          ease: "easeOut" as const
        }
      },
      exit: { 
        opacity: 0, 
        y: -10,
        transition: { duration: 0.3 }
      }
    };

    const highlightVariants = {
      initial: { backgroundColor: 'transparent' },
      highlight: { 
        backgroundColor: 'hsl(var(--primary) / 0.2)',
        transition: { 
          duration: 0.5, 
          repeat: 2, 
          repeatType: 'reverse' as const
        }
      }
    };

    switch (step.type) {
      case 'title':
        return (
          <motion.h3 
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-xl font-bold text-center gradient-text"
          >
            {step.content}
          </motion.h3>
        );
      
      case 'text':
        return (
          <motion.p 
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-base text-foreground/90 leading-relaxed"
          >
            {step.content}
          </motion.p>
        );
      
      case 'equation':
        return (
          <motion.div 
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex justify-center py-4"
          >
            <motion.div
              variants={step.highlight ? highlightVariants : undefined}
              initial="initial"
              animate={step.highlight ? "highlight" : "initial"}
              className="px-6 py-4 rounded-xl bg-secondary/30 border border-border/50"
            >
              <span className="text-xl">
                <MathRenderer latex={step.content} displayMode />
              </span>
            </motion.div>
          </motion.div>
        );
      
      case 'highlight':
        return (
          <motion.div 
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <span className="text-primary font-bold">!</span>
            </motion.div>
            <div className="text-sm text-foreground">
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
            className="flex justify-center py-8"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-3 h-3 rounded-full bg-primary"
            />
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
export function generateAnimationSteps(
  subtopicName: string,
  theoryExplanation: string,
  workedExample?: { problem: string; steps: string[]; answer: string }
): AnimationStep[] {
  const animationSteps: AnimationStep[] = [];

  // Title
  animationSteps.push({
    type: 'title',
    content: subtopicName,
    duration: 2000,
    voiceover: `Let's learn about ${subtopicName}`
  });

  // Parse theory explanation into meaningful chunks
  if (theoryExplanation) {
    const paragraphs = theoryExplanation.split('\n\n').filter(p => p.trim());
    
    paragraphs.forEach((paragraph, idx) => {
      // Check if paragraph contains a definition or key concept
      if (paragraph.includes('**') || paragraph.toLowerCase().includes('definition')) {
        animationSteps.push({
          type: 'highlight',
          content: paragraph.replace(/\*\*/g, ''),
          duration: 4000,
          voiceover: `Key concept: ${paragraph.replace(/\*\*/g, '')}`
        });
      } else if (paragraph.match(/\$.*\$/) || paragraph.match(/[=<>]/)) {
        // This looks like a formula/equation
        animationSteps.push({
          type: 'equation',
          content: paragraph,
          duration: 3500,
          highlight: 'true',
          voiceover: `Here is the formula: ${paragraph}`
        });
      } else {
        animationSteps.push({
          type: 'text',
          content: paragraph,
          duration: 3000 + (paragraph.length * 20), // Longer text = more time
          voiceover: paragraph
        });
      }
    });
  }

  // Add worked example if provided
  if (workedExample) {
    animationSteps.push({
      type: 'transition',
      content: '',
      duration: 1500
    });

    animationSteps.push({
      type: 'title',
      content: 'Worked Example',
      duration: 2000,
      voiceover: 'Now let\'s work through an example together'
    });

    animationSteps.push({
      type: 'equation',
      content: workedExample.problem,
      duration: 3000,
      voiceover: `Our problem is: ${workedExample.problem}`
    });

    workedExample.steps.forEach((step, idx) => {
      animationSteps.push({
        type: 'text',
        content: `Step ${idx + 1}: ${step}`,
        duration: 3500,
        voiceover: step
      });
    });

    animationSteps.push({
      type: 'highlight',
      content: `Answer: ${workedExample.answer}`,
      duration: 3000,
      voiceover: `And our final answer is: ${workedExample.answer}`
    });
  }

  return animationSteps;
}
