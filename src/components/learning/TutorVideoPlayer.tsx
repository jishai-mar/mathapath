import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorAvatar, TutorMood } from '@/components/tutor/TutorAvatar';
import { useTutorTTS, VoiceContext } from '@/hooks/useTutorTTS';
import { useTutor } from '@/contexts/TutorContext';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Settings,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export interface VideoStep {
  type: 'intro' | 'definition' | 'rule' | 'formula' | 'example-intro' | 'example-step' | 'mistake' | 'summary';
  content: string;
  voiceoverText: string;
  duration?: number;
  highlight?: boolean;
}

interface TutorVideoPlayerProps {
  title: string;
  steps: VideoStep[];
  onComplete?: () => void;
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const DEFAULT_STEP_DURATION = 5000;

export default function TutorVideoPlayer({
  title,
  steps,
  onComplete,
  onClose,
  isFullscreen = false,
  onToggleFullscreen,
}: TutorVideoPlayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [tutorMood, setTutorMood] = useState<TutorMood>('idle');
  
  const { preferences } = useTutor();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { speak, stopSpeaking, isSpeaking, isLoading } = useTutorTTS({
    personality: (preferences?.personality as any) || 'patient',
    onSpeakStart: () => setTutorMood('explaining'),
    onSpeakEnd: () => setTutorMood('idle'),
  });

  const currentStepData = steps[currentStep];
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  // Determine tutor mood based on step type
  const getMoodForStep = (step: VideoStep): TutorMood => {
    switch (step.type) {
      case 'intro': return 'happy';
      case 'definition': return 'explaining';
      case 'rule': return 'encouraging';
      case 'formula': return 'thinking';
      case 'example-intro': return 'curious';
      case 'example-step': return 'explaining';
      case 'mistake': return 'encouraging';
      case 'summary': return 'celebrating';
      default: return 'idle';
    }
  };

  // Get voice context for step
  const getContextForStep = (step: VideoStep): VoiceContext => {
    switch (step.type) {
      case 'intro': return 'encouraging';
      case 'definition': return 'explaining';
      case 'rule': return 'explaining';
      case 'formula': return 'explaining';
      case 'example-intro': return 'encouraging';
      case 'example-step': return 'explaining';
      case 'mistake': return 'correcting';
      case 'summary': return 'celebrating';
      default: return 'default';
    }
  };

  const goToNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsPlaying(false);
      onComplete?.();
    }
  }, [currentStep, steps.length, onComplete]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      stopSpeaking();
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, stopSpeaking]);

  const restart = useCallback(() => {
    stopSpeaking();
    setCurrentStep(0);
    setIsPlaying(true);
  }, [stopSpeaking]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopSpeaking();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, stopSpeaking]);

  // Play step with voice
  useEffect(() => {
    if (!isPlaying || !currentStepData) return;

    // Set mood
    setTutorMood(getMoodForStep(currentStepData));

    // Speak voiceover if not muted
    if (!isMuted && currentStepData.voiceoverText) {
      const context = getContextForStep(currentStepData);
      speak(currentStepData.voiceoverText, context);
    }

    // Calculate duration based on voiceover length or default
    const baseDuration = currentStepData.duration || DEFAULT_STEP_DURATION;
    const adjustedDuration = baseDuration / playbackSpeed;

    // Auto-advance timer
    timerRef.current = setTimeout(() => {
      goToNextStep();
    }, adjustedDuration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentStep, currentStepData, isMuted, playbackSpeed, speak, goToNextStep]);

  // Stop speaking when muted
  useEffect(() => {
    if (isMuted) {
      stopSpeaking();
    }
  }, [isMuted, stopSpeaking]);

  const renderStepContent = (step: VideoStep) => {
    const baseVariants = {
      hidden: { opacity: 0, y: 20, scale: 0.95 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
      exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
    };

    switch (step.type) {
      case 'intro':
        return (
          <motion.div variants={baseVariants} initial="hidden" animate="visible" exit="exit" className="text-center">
            <h2 className="text-2xl font-bold gradient-text mb-2">{step.content}</h2>
            <p className="text-muted-foreground">Let's learn this together!</p>
          </motion.div>
        );

      case 'definition':
        return (
          <motion.div variants={baseVariants} initial="hidden" animate="visible" exit="exit" className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Definition</span>
            <p className="text-xl font-medium text-foreground">
              <MathRenderer segments={createSegmentsFromSolution(step.content)} />
            </p>
          </motion.div>
        );

      case 'rule':
        return (
          <motion.div 
            variants={baseVariants} 
            initial="hidden" 
            animate="visible" 
            exit="exit"
            className="p-4 rounded-xl bg-primary/10 border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <p className="text-lg font-semibold text-primary">
                <MathRenderer segments={createSegmentsFromSolution(step.content)} />
              </p>
            </div>
          </motion.div>
        );

      case 'formula':
        return (
          <motion.div 
            variants={baseVariants} 
            initial="hidden" 
            animate="visible" 
            exit="exit"
            className="p-8 rounded-xl bg-card border-2 border-primary/30 text-center"
          >
            <div className="text-3xl">
              <MathRenderer segments={createSegmentsFromSolution(step.content)} />
            </div>
          </motion.div>
        );

      case 'example-intro':
        return (
          <motion.div variants={baseVariants} initial="hidden" animate="visible" exit="exit" className="text-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Example</span>
            <p className="text-xl font-medium text-foreground mt-2">
              <MathRenderer segments={createSegmentsFromSolution(step.content)} />
            </p>
          </motion.div>
        );

      case 'example-step':
        return (
          <motion.div 
            variants={baseVariants} 
            initial="hidden" 
            animate="visible" 
            exit="exit"
            className="flex items-center gap-4"
          >
            <motion.div 
              className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-primary font-medium">→</span>
            </motion.div>
            <p className="text-lg text-foreground flex-1">
              <MathRenderer segments={createSegmentsFromSolution(step.content)} />
            </p>
          </motion.div>
        );

      case 'mistake':
        return (
          <motion.div 
            variants={baseVariants} 
            initial="hidden" 
            animate="visible" 
            exit="exit"
            className="p-4 rounded-xl bg-destructive/5 border border-destructive/20"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-foreground">
                <MathRenderer segments={createSegmentsFromSolution(step.content)} />
              </p>
            </div>
          </motion.div>
        );

      case 'summary':
        return (
          <motion.div variants={baseVariants} initial="hidden" animate="visible" exit="exit" className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
              className="text-4xl mb-4"
            >
              🎉
            </motion.div>
            <h3 className="text-xl font-bold text-foreground mb-2">Great job!</h3>
            <p className="text-muted-foreground">
              <MathRenderer segments={createSegmentsFromSolution(step.content)} />
            </p>
          </motion.div>
        );

      default:
        return (
          <motion.div variants={baseVariants} initial="hidden" animate="visible" exit="exit">
            <p className="text-foreground"><MathRenderer segments={createSegmentsFromSolution(step.content)} /></p>
          </motion.div>
        );
    }
  };

  return (
    <div className={`flex flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-50' : 'rounded-xl border border-border'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/20">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          🎬 {title}
        </h4>
        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <Button variant="ghost" size="sm" onClick={onToggleFullscreen} className="h-8 w-8 p-0">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[300px]">
        {/* Tutor avatar section */}
        <div className="w-full md:w-1/3 p-6 flex flex-col items-center justify-center bg-secondary/10 border-b md:border-b-0 md:border-r border-border">
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
          >
            <TutorAvatar
              style={(preferences?.avatarStyle as any) || 'friendly-robot'}
              mood={tutorMood}
              size="xl"
            />
          </motion.div>
          
          {/* Speaking indicator */}
          {isSpeaking && (
            <motion.div 
              className="flex items-center gap-1 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: [4, 16, 4] }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity, 
                    delay: i * 0.1,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </motion.div>
          )}
          
          {isLoading && (
            <p className="text-xs text-muted-foreground mt-2">Loading voice...</p>
          )}
        </div>

        {/* Content section */}
        <div className="flex-1 p-6 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <div key={currentStep} className="flex-1 flex items-center justify-center">
              {currentStepData && renderStepContent(currentStepData)}
            </div>
          </AnimatePresence>

          {/* Subtitles */}
          {showSubtitles && currentStepData?.voiceoverText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg bg-secondary/50 text-center"
            >
              <p className="text-sm text-muted-foreground italic">
                {currentStepData.voiceoverText}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4">
        <Progress value={progress} className="h-1" />
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex items-center justify-between bg-secondary/10 border-t border-border">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={goToPrevStep} disabled={currentStep === 0} className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={togglePlay} className="h-8 w-8 p-0">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button variant="ghost" size="sm" onClick={goToNextStep} disabled={currentStep >= steps.length - 1} className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={restart} className="h-8 w-8 p-0">
            <RotateCcw className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-border mx-2" />

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsMuted(!isMuted)} 
            className="h-8 w-8 p-0"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`h-8 px-2 text-xs ${showSubtitles ? 'bg-primary/10' : ''}`}
          >
            CC
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPlaybackSpeed(s => s === 1 ? 1.25 : s === 1.25 ? 0.75 : 1)}
            className="h-8 px-2 text-xs"
          >
            {playbackSpeed}x
          </Button>
        </div>

        <span className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>
    </div>
  );
}

// Helper function to generate video steps from theory content
export function generateVideoSteps(
  subtopicName: string,
  content: {
    definition?: string;
    key_rule?: string;
    formula?: string;
    when_to_use?: string;
    worked_example?: { problem: string; steps: string[]; answer: string };
    common_mistake?: { wrong: string; right: string };
  }
): VideoStep[] {
  const steps: VideoStep[] = [];

  // Intro
  steps.push({
    type: 'intro',
    content: subtopicName,
    voiceoverText: `Welcome! Today we're going to learn about ${subtopicName}. Let me explain this step by step.`,
    duration: 4000,
  });

  // Definition
  if (content.definition) {
    steps.push({
      type: 'definition',
      content: content.definition,
      voiceoverText: content.definition.replace(/\$/g, '').replace(/\\/g, ' '),
      duration: 6000,
    });
  }

  // Key rule
  if (content.key_rule) {
    steps.push({
      type: 'rule',
      content: content.key_rule,
      voiceoverText: `Here's the key rule you need to remember: ${content.key_rule.replace(/\$/g, '').replace(/\\/g, ' ')}`,
      duration: 5000,
    });
  }

  // Formula
  if (content.formula) {
    steps.push({
      type: 'formula',
      content: content.formula,
      voiceoverText: `This is the formula we'll be using. Take a moment to look at it carefully.`,
      duration: 6000,
      highlight: true,
    });

    if (content.when_to_use) {
      steps.push({
        type: 'definition',
        content: content.when_to_use,
        voiceoverText: `We use this formula ${content.when_to_use}`,
        duration: 4000,
      });
    }
  }

  // Worked example
  if (content.worked_example) {
    steps.push({
      type: 'example-intro',
      content: content.worked_example.problem,
      voiceoverText: `Now let's work through an example. Here's the problem: ${content.worked_example.problem.replace(/\$/g, '').replace(/\\/g, ' ')}`,
      duration: 5000,
    });

    content.worked_example.steps.forEach((step, idx) => {
      steps.push({
        type: 'example-step',
        content: step,
        voiceoverText: `Step ${idx + 1}: ${step.replace(/\$/g, '').replace(/\\/g, ' ').replace('→', 'gives us')}`,
        duration: 5000,
      });
    });

    steps.push({
      type: 'example-step',
      content: `Answer: ${content.worked_example.answer}`,
      voiceoverText: `And the final answer is ${content.worked_example.answer.replace(/\$/g, '').replace(/\\/g, ' ')}`,
      duration: 4000,
    });
  }

  // Common mistake
  if (content.common_mistake) {
    steps.push({
      type: 'mistake',
      content: `Don't: ${content.common_mistake.wrong} → Do: ${content.common_mistake.right}`,
      voiceoverText: `Watch out for this common mistake. Don't ${content.common_mistake.wrong}. Instead, ${content.common_mistake.right}.`,
      duration: 6000,
    });
  }

  // Summary
  steps.push({
    type: 'summary',
    content: `You've learned about ${subtopicName}!`,
    voiceoverText: `Great job! You've learned about ${subtopicName}. Now you're ready to practice!`,
    duration: 4000,
  });

  return steps;
}
