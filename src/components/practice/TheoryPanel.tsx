import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Lightbulb, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MathRenderer from '@/components/MathRenderer';
import { TheoryContent } from './types';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';

interface TheoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theory: TheoryContent | null;
  topicName?: string;
}

export function TheoryPanel({ isOpen, onClose, theory, topicName }: TheoryPanelProps) {
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
                <div className="p-2 rounded-xl bg-primary/10">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Theory</h2>
                  {topicName && (
                    <p className="text-sm text-muted-foreground">{topicName}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="h-[calc(100%-80px)]">
              <div className="p-6 space-y-6">
                {theory ? (
                  <>
                    {/* Title */}
                    <div>
                      <h3 className="text-xl font-semibold mb-3">{theory.title}</h3>
                      <div className="text-muted-foreground leading-relaxed">
                        <MathRenderer segments={createSegmentsFromSolution(theory.explanation)} />
                      </div>
                    </div>

                    {/* Key Formulas */}
                    {theory.keyFormulas && theory.keyFormulas.length > 0 && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">Key Formulas & Rules</h4>
                        </div>
                        <ul className="space-y-2">
                          {theory.keyFormulas.map((formula, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-primary font-mono text-sm mt-0.5">•</span>
                              <MathRenderer segments={createSegmentsFromSolution(formula)} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mini Example */}
                    {theory.miniExample && (
                      <div className="p-4 rounded-xl bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <h4 className="font-medium">Quick Example</h4>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Problem:</p>
                            <div className="font-medium">
                              <MathRenderer segments={createSegmentsFromSolution(theory.miniExample.problem)} />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Solution:</p>
                            <div className="text-muted-foreground">
                              <MathRenderer segments={createSegmentsFromSolution(theory.miniExample.solution)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Loading theory content...</p>
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
