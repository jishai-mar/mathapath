import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWakeWordDetection } from '@/hooks/useWakeWordDetection';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { ConversationalTutor } from './ConversationalTutor';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function PersistentGilbert() {
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(true);
  const [showActivationGlow, setShowActivationGlow] = useState(false);
  const exerciseContext = useExerciseContext();
  const { playSound } = useSoundEffects();

  const handleWakeWordDetected = useCallback((transcript: string) => {
    console.log('Wake word detected in:', transcript);
    
    // Play activation sound
    playSound('achievement');
    
    // Show visual feedback
    setShowActivationGlow(true);
    setTimeout(() => setShowActivationGlow(false), 1000);
    
    // Open the tutor
    setIsTutorOpen(true);
  }, [playSound]);

  const { isListening, wakeWordDetected, isSupported, transcript } = useWakeWordDetection({
    wakeWords: ['gilbert', 'hey gilbert', 'hé gilbert', 'hoi gilbert', 'hi gilbert'],
    onWakeWordDetected: handleWakeWordDetected,
    enabled: isWakeWordEnabled && !isTutorOpen, // Disable when tutor is open
  });

  const handleCloseTutor = useCallback(() => {
    setIsTutorOpen(false);
  }, []);

  const toggleWakeWord = useCallback(() => {
    setIsWakeWordEnabled(prev => !prev);
  }, []);

  // Show current context status for debugging (can be removed in production)
  const hasActiveContext = !!(exerciseContext?.currentQuestion);

  return (
    <>
      {/* Floating Gilbert Button */}
      <TooltipProvider>
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {/* Context indicator */}
          {hasActiveContext && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Context active</span>
            </motion.div>
          )}

          {/* Wake word listening indicator */}
          <AnimatePresence>
            {isListening && isWakeWordEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 text-xs text-muted-foreground max-w-[200px]"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span>Zeg "Gilbert" om te praten</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Gilbert Button */}
          <div className="relative">
            {/* Activation glow */}
            <AnimatePresence>
              {(showActivationGlow || wakeWordDetected) && (
                <motion.div
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
            </AnimatePresence>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  className={`h-14 w-14 rounded-full shadow-lg transition-all ${
                    isListening ? 'bg-primary hover:bg-primary/90' : 'bg-muted hover:bg-muted/90'
                  }`}
                  onClick={() => setIsTutorOpen(true)}
                >
                  <motion.div
                    animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative"
                  >
                    {/* Gilbert avatar placeholder */}
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-lg font-bold text-primary-foreground">
                      G
                    </div>
                  </motion.div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Praat met Gilbert</p>
              </TooltipContent>
            </Tooltip>

            {/* Wake word toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isWakeWordEnabled ? "default" : "secondary"}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0"
                  onClick={toggleWakeWord}
                >
                  {isWakeWordEnabled ? (
                    <Mic className="h-3 w-3" />
                  ) : (
                    <MicOff className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{isWakeWordEnabled ? 'Wake word aan' : 'Wake word uit'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      {/* Not supported warning */}
      {!isSupported && isWakeWordEnabled && (
        <div className="fixed bottom-24 right-6 z-40 bg-destructive/10 text-destructive text-xs px-3 py-2 rounded-lg max-w-[200px]">
          Spraakherkenning niet ondersteund in deze browser
        </div>
      )}

      {/* Conversational Tutor Modal */}
      <ConversationalTutor
        isOpen={isTutorOpen}
        onClose={handleCloseTutor}
      />
    </>
  );
}
