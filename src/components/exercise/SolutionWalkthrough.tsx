import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MathRenderer from '@/components/MathRenderer';
import TutorCharacter from '@/components/tutor/TutorCharacter';
import { useTutorTTS } from '@/hooks/useTutorTTS';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  VolumeX,
  X,
  Lightbulb,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface SolutionStep {
  stepNumber: number;
  title: string;
  explanation: string;
  math: string;
  voiceover: string;
}

interface SolutionData {
  steps: SolutionStep[];
  finalAnswer: string;
  tip: string;
}

interface SolutionWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  subtopicName: string;
  correctAnswer?: string;
}

export function SolutionWalkthrough({
  isOpen,
  onClose,
  question,
  subtopicName,
  correctAnswer,
}: SolutionWalkthroughProps) {
  const [solution, setSolution] = useState<SolutionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const { speak, stopSpeaking, isSpeaking, isLoading: ttsLoading } = useTutorTTS({
    personality: 'patient',
    defaultContext: 'explaining',
    onSpeakEnd: () => {
      // Auto-advance when TTS finishes
      if (isPlaying && solution && currentStepIndex < solution.steps.length - 1) {
        setTimeout(() => {
          advanceStep();
        }, 500);
      } else if (isPlaying && solution && currentStepIndex === solution.steps.length - 1) {
        setIsPlaying(false);
        setCompletedSteps(prev => new Set(prev).add(currentStepIndex));
      }
    },
  });

  // Fetch solution when dialog opens
  useEffect(() => {
    if (isOpen && !solution) {
      fetchSolution();
    }
  }, [isOpen]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setIsPlaying(false);
      setCurrentStepIndex(0);
      setCompletedSteps(new Set());
    }
  }, [isOpen, stopSpeaking]);

  const fetchSolution = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('solve-exercise', {
        body: { question, subtopicName, correctAnswer },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setSolution(data);
    } catch (err) {
      console.error('Error fetching solution:', err);
      setError(err instanceof Error ? err.message : 'Kon oplossing niet laden');
    } finally {
      setIsLoading(false);
    }
  };

  const advanceStep = useCallback(() => {
    if (!solution) return;
    
    setCompletedSteps(prev => new Set(prev).add(currentStepIndex));
    
    if (currentStepIndex < solution.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      
      if (isPlaying && !isMuted) {
        speak(solution.steps[nextIndex].voiceover, 'explaining');
      }
    } else {
      setIsPlaying(false);
    }
  }, [solution, currentStepIndex, isPlaying, isMuted, speak]);

  const handlePlayPause = () => {
    if (!solution) return;

    if (isPlaying) {
      setIsPlaying(false);
      stopSpeaking();
    } else {
      setIsPlaying(true);
      if (!isMuted) {
        speak(solution.steps[currentStepIndex].voiceover, 'explaining');
      }
    }
  };

  const handleRestart = () => {
    stopSpeaking();
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    setIsPlaying(false);
  };

  const handleSkipStep = () => {
    stopSpeaking();
    advanceStep();
  };

  const handleStepClick = (index: number) => {
    stopSpeaking();
    setCurrentStepIndex(index);
    setIsPlaying(false);
  };

  const currentStep = solution?.steps[currentStepIndex];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Volledige Uitwerking
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <TutorCharacter mood="thinking" size="md" />
                <Loader2 className="w-6 h-6 text-primary animate-spin absolute -bottom-2 -right-2" />
              </div>
              <p className="text-muted-foreground">Oplossing wordt voorbereid...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchSolution}>Opnieuw proberen</Button>
            </div>
          ) : solution ? (
            <div className="space-y-6">
              {/* Original Question */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground mb-2">Opgave:</p>
                <div className="text-lg">
                  <MathRenderer latex={question} displayMode />
                </div>
              </div>

              {/* Tutor and Controls */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <TutorCharacter 
                    mood={isSpeaking ? 'explaining' : isPlaying ? 'thinking' : 'idle'} 
                    size="sm" 
                  />
                  <div className="text-sm text-muted-foreground">
                    Stap {currentStepIndex + 1} van {solution.steps.length}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRestart}
                    title="Opnieuw beginnen"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Geluid aan' : 'Geluid uit'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSkipStep}
                    disabled={currentStepIndex >= solution.steps.length - 1}
                    title="Volgende stap"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handlePlayPause}
                    className="gap-2 min-w-32"
                    disabled={ttsLoading}
                  >
                    {ttsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isPlaying || isSpeaking ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pauzeren
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Afspelen
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step Progress Dots */}
              <div className="flex items-center justify-center gap-2">
                {solution.steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleStepClick(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentStepIndex
                        ? 'bg-primary scale-125'
                        : completedSteps.has(index)
                        ? 'bg-primary/50'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              {/* Current Step Content */}
              <AnimatePresence mode="wait">
                {currentStep && (
                  <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {currentStep.stepNumber}
                        </div>
                        <h3 className="text-lg font-semibold">{currentStep.title}</h3>
                        {completedSteps.has(currentStepIndex) && (
                          <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                        )}
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{currentStep.explanation}</p>
                      
                      {currentStep.math && (
                        <div className="p-4 rounded-xl bg-muted/50 text-center">
                          <MathRenderer latex={currentStep.math} displayMode />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Final Answer and Tip */}
              {completedSteps.size === solution.steps.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-6 rounded-2xl bg-primary/10 border border-primary/30">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Eindantwoord
                    </h3>
                    <div className="text-xl">
                      <MathRenderer latex={solution.finalAnswer} />
                    </div>
                  </div>

                  {solution.tip && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-sm">
                        <Lightbulb className="w-4 h-4 inline mr-2 text-primary" />
                        <strong>Tip:</strong> {solution.tip}
                      </p>
                    </div>
                  )}

                  <Button onClick={onClose} className="w-full" size="lg">
                    Begrepen, sluiten
                  </Button>
                </motion.div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
