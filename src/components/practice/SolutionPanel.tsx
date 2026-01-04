import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { SolutionStep } from './types';

interface SolutionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  steps: SolutionStep[] | null;
  finalAnswer: string | null;
  tip: string | null;
  question?: string;
}

export function SolutionPanel({ 
  isOpen, 
  onClose, 
  steps, 
  finalAnswer, 
  tip,
  question 
}: SolutionPanelProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border shadow-2xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-500/10">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Full Solution</h2>
                  <p className="text-sm text-muted-foreground">Step-by-step walkthrough</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="h-[calc(100%-80px)]">
              <div className="p-6 space-y-6">
                {/* Original Question */}
                {question && (
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Question:</p>
                    <div className="font-medium">
                      <MathRenderer segments={createSegmentsFromSolution(question ?? '')} />
                    </div>
                  </div>
                )}

                {/* Steps */}
                {steps && steps.length > 0 ? (
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <motion.div
                        key={step.stepNumber}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                      >
                        {/* Step connector line */}
                        {index < steps.length - 1 && (
                          <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-border" />
                        )}
                        
                        <div className="flex gap-4">
                          {/* Step number */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm z-10">
                            {step.stepNumber}
                          </div>
                          
                          {/* Step content */}
                          <div className="flex-1 pb-6">
                            <h4 className="font-semibold text-sm mb-2">{step.title}</h4>
                            
                            <div className="p-3 rounded-lg bg-muted/30 border border-border mb-2">
                              <p className="text-sm text-muted-foreground mb-1">{step.action}</p>
                              <div className="font-mono text-sm">
                                <MathRenderer segments={createSegmentsFromSolution(step.calculation)} />
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {step.explanation}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Loading solution...</p>
                  </div>
                )}

                {/* Final Answer */}
                {finalAnswer && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <h4 className="font-semibold text-green-700 dark:text-green-400">Final Answer</h4>
                    </div>
                    <div className="text-lg font-medium">
                      <MathRenderer segments={createSegmentsFromSolution(finalAnswer ?? '')} />
                    </div>
                  </motion.div>
                )}

                {/* Tip */}
                {tip && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-1">Pro Tip</h4>
                        <p className="text-sm text-muted-foreground">{tip}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
