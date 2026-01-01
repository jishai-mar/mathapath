import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import MathRenderer from '@/components/MathRenderer';
import { MultipleSolutionsRenderer } from '@/components/math/MultipleSolutionsRenderer';
import TutorCharacter from '@/components/tutor/TutorCharacter';
import { TheoryDiagram } from '@/components/exercise/TheoryDiagram';
import { useTutorTTS } from '@/hooks/useTutorTTS';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
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
  CheckCircle2,
  ChevronRight,
  BookmarkPlus,
  BookmarkCheck,
  AlertTriangle,
  TrendingUp,
  GitBranch,
  ArrowRight
} from 'lucide-react';

interface SolutionStep {
  stepNumber: number;
  title: string;
  explanation: string;
  math: string;
  voiceover: string;
}

interface SolutionData {
  theoryReview?: string;
  commonMistakes?: string[];
  diagramType?: string;
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
  exerciseId?: string;
  diagnosticQuestionId?: string;
}

export function SolutionWalkthrough({
  isOpen,
  onClose,
  question,
  subtopicName,
  correctAnswer,
  exerciseId,
  diagnosticQuestionId,
}: SolutionWalkthroughProps) {
  const { user } = useAuth();
  const [solution, setSolution] = useState<SolutionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSavedToNotebook, setIsSavedToNotebook] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { speak, stopSpeaking, isSpeaking, isLoading: ttsLoading } = useTutorTTS({
    personality: 'patient',
    defaultContext: 'explaining',
    onSpeakEnd: () => {
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

  useEffect(() => {
    if (isOpen && !solution) {
      fetchSolution();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setIsPlaying(false);
      setCurrentStepIndex(0);
      setCompletedSteps(new Set());
      setIsSavedToNotebook(false);
    }
  }, [isOpen, stopSpeaking]);

  const saveToNotebook = async () => {
    if (!user || !solution) return;
    
    setIsSaving(true);
    try {
      // Format the solution steps for storage
      const stepsContent = solution.steps.map(step => 
        `**Stap ${step.stepNumber}: ${step.title}**\n${step.explanation}\n${step.math ? `$$${step.math}$$` : ''}`
      ).join('\n\n');
      
      const fullContent = `**Opgave:** ${question}\n\n${stepsContent}\n\n**Eindantwoord:** ${solution.finalAnswer}${solution.tip ? `\n\n**Tip:** ${solution.tip}` : ''}`;
      
      const { error: insertError } = await supabase
        .from('student_session_notes')
        .insert({
          user_id: user.id,
          note_type: 'worked_example',
          content: fullContent,
          subtopic_name: subtopicName,
        });
      
      if (insertError) throw insertError;
      
      setIsSavedToNotebook(true);
      toast.success('Uitwerking opgeslagen in je notitieboek!');
    } catch (err) {
      console.error('Error saving to notebook:', err);
      toast.error('Kon uitwerking niet opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchSolution = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('solve-exercise', {
        body: { 
          question, 
          subtopicName, 
          correctAnswer,
          exerciseId,
          diagnosticQuestionId,
        },
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
  const progressPercent = solution ? ((completedSteps.size) / solution.steps.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Lightbulb className="w-5 h-5 text-primary" />
              </motion.div>
              Stap-voor-Stap Uitwerking
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <TutorCharacter mood="thinking" size="md" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-2 -right-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-6 h-6 text-primary" />
                </motion.div>
              </div>
              <motion.p 
                className="text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Oplossing wordt voorbereid...
              </motion.p>
            </motion.div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchSolution}>Opnieuw proberen</Button>
            </motion.div>
          ) : solution ? (
            <div className="space-y-6">
              {/* Original Question */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-muted/30 border border-border/50"
              >
                <p className="text-sm text-muted-foreground mb-2">Opgave:</p>
                <div className="text-lg">
                  <MathRenderer latex={question} displayMode />
                </div>
              </motion.div>

              {/* Theory Review Section */}
              {solution.theoryReview && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary mb-2">Theorie opfrissen</p>
                      <div className="text-sm text-foreground leading-relaxed">
                        <MathRenderer latex={solution.theoryReview} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Common Mistakes Section */}
              {solution.commonMistakes && solution.commonMistakes.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-4 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-destructive mb-2">Let op! Veelgemaakte fouten</p>
                      <ul className="space-y-2">
                        {solution.commonMistakes.map((mistake, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="text-destructive font-bold shrink-0">×</span>
                            <span>{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Visual Diagram Section */}
              {solution.diagramType && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="p-4 rounded-xl bg-accent/30 border border-accent/50"
                >
                  <TheoryDiagram type={solution.diagramType} />
                </motion.div>
              )}


              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Voortgang</span>
                  <span className="font-medium text-primary">
                    {completedSteps.size} / {solution.steps.length} stappen
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </motion.div>

              {/* Tutor and Controls */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
                  >
                    <TutorCharacter 
                      mood={isSpeaking ? 'explaining' : isPlaying ? 'thinking' : 'idle'} 
                      size="sm" 
                    />
                  </motion.div>
                  <div className="text-sm text-muted-foreground">
                    Stap <span className="font-semibold text-foreground">{currentStepIndex + 1}</span> van {solution.steps.length}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Stop Speaking Button - prominent when speaking */}
                  <AnimatePresence>
                    {isSpeaking && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={stopSpeaking}
                          className="gap-2"
                        >
                          <VolumeX className="w-4 h-4" />
                          Stop praten
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRestart}
                    title="Opnieuw beginnen"
                    className="transition-transform hover:scale-105"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Geluid aan' : 'Geluid uit'}
                    className="transition-transform hover:scale-105"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSkipStep}
                    disabled={currentStepIndex >= solution.steps.length - 1}
                    title="Volgende stap"
                    className="transition-transform hover:scale-105"
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
              </motion.div>

              {/* Step Timeline */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-1 py-2"
              >
                {solution.steps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <motion.button
                      onClick={() => handleStepClick(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        index === currentStepIndex
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : completedSteps.has(index)
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {completedSteps.has(index) && index !== currentStepIndex ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-semibold">{index + 1}</span>
                      )}
                      {index === currentStepIndex && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                    {index < solution.steps.length - 1 && (
                      <div className={`w-4 h-0.5 mx-1 transition-colors ${
                        completedSteps.has(index) ? 'bg-primary/50' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </motion.div>

              {/* Current Step Content */}
              <AnimatePresence mode="wait">
                {currentStep && (
                  <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="space-y-4"
                  >
                    <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-lg overflow-hidden relative">
                      {/* Step number badge */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-xl text-sm font-semibold"
                      >
                        Stap {currentStep.stepNumber}
                      </motion.div>

                      <div className="flex items-start gap-4 mb-4">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0"
                        >
                          {currentStep.stepNumber}
                        </motion.div>
                        <div className="flex-1 pt-2">
                          <motion.h3 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="text-lg font-semibold flex items-center gap-2"
                          >
                            {currentStep.title}
                            {completedSteps.has(currentStepIndex) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring" }}
                              >
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              </motion.div>
                            )}
                          </motion.h3>
                        </div>
                      </div>
                      
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground mb-4 leading-relaxed"
                      >
                        {currentStep.explanation}
                      </motion.p>
                      
                      {currentStep.math && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                          className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 text-center border border-border/30"
                        >
                          <MathRenderer latex={currentStep.math} displayMode />
                        </motion.div>
                      )}

                      {/* Next step hint */}
                      {currentStepIndex < solution.steps.length - 1 && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          onClick={handleSkipStep}
                          className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline group"
                        >
                          <span>Volgende stap</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Final Answer and Tip */}
              {completedSteps.size === solution.steps.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="space-y-4"
                >
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 relative overflow-hidden">
                    {/* Celebration particles */}
                    <motion.div
                      className="absolute top-2 right-2 text-lg"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: 3 }}
                    >
                      ✨
                    </motion.div>
                    <motion.div
                      className="absolute top-4 right-12 text-lg"
                      animate={{ scale: [0, 1, 0] }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    >
                      🎉
                    </motion.div>

                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                      >
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </motion.div>
                      Eindantwoord
                    </h3>
                    <MultipleSolutionsRenderer answer={solution.finalAnswer} className="text-xl" />
                  </div>

                  {solution.tip && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
                    >
                      <p className="text-sm flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-amber-600 dark:text-amber-400">Onthoud:</strong>{' '}
                          {solution.tip}
                        </span>
                      </p>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3"
                  >
                    <Button 
                      onClick={saveToNotebook} 
                      variant="outline"
                      size="lg"
                      className="flex-1 gap-2"
                      disabled={isSavedToNotebook || isSaving || !user}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isSavedToNotebook ? (
                        <BookmarkCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <BookmarkPlus className="w-4 h-4" />
                      )}
                      {isSavedToNotebook ? 'Opgeslagen' : 'Opslaan in notitieboek'}
                    </Button>
                    <Button onClick={onClose} className="flex-1" size="lg">
                      Sluiten
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
