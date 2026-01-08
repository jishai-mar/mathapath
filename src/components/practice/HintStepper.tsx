import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Eye, CheckCircle2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { SolutionStep, TheoryBasedHint } from './types';
import { TheoryLinkBadge } from '@/components/exercise/TheoryLinkBadge';

interface HintStepperProps {
  steps: SolutionStep[] | null;
  revealedCount: number;
  onRevealNext: () => void;
  isLoading?: boolean;
  theoryHints?: TheoryBasedHint[];
}

export function HintStepper({ 
  steps, 
  revealedCount, 
  onRevealNext,
  isLoading = false,
  theoryHints
}: HintStepperProps) {
  const totalSteps = steps?.length || 0;
  const hasMoreSteps = revealedCount < totalSteps;
  const revealedSteps = steps?.slice(0, revealedCount) || [];

  return (
    <div className="space-y-4">
      {/* Steps indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Steps revealed: {revealedCount}/{totalSteps}
          </span>
        </div>
        
        {/* Progress dots */}
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < revealedCount 
                  ? 'bg-primary' 
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Revealed steps */}
      <AnimatePresence mode="popLayout">
        {revealedSteps.map((step, index) => (
          <motion.div
            key={step.stepNumber}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-start gap-3">
                {/* Step number badge */}
                <Badge 
                  variant="secondary" 
                  className="flex-shrink-0 w-6 h-6 p-0 flex items-center justify-center rounded-full"
                >
                  {step.stepNumber}
                </Badge>
                
                <div className="flex-1 space-y-2">
                  {/* Title */}
                  <h4 className="font-medium text-sm">{step.title}</h4>
                  
                  {/* Action */}
                  <p className="text-sm text-primary">{step.action}</p>
                  
                  {/* Calculation */}
                  <div className="p-2 rounded-lg bg-background/50 font-mono text-sm">
                    <MathRenderer segments={createSegmentsFromSolution(step.calculation)} />
                  </div>
                  
                  {/* Explanation */}
                  <p className="text-sm text-muted-foreground">{step.explanation}</p>

                  {/* Theory Citation */}
                  {(step.theoryCitation || step.theoryBlockReference) && (
                    <div className="flex items-center gap-2 pt-1">
                      <BookOpen className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {step.theoryCitation || `By ${step.theoryBlockReference}`}
                      </span>
                      {step.theoryBlockReference && (
                        <TheoryLinkBadge 
                          blockNumber={step.theoryBlockReference}
                          blockId={step.theoryBlockId}
                          relevance="reference"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reveal button */}
      {hasMoreSteps ? (
        <Button
          variant="outline"
          onClick={onRevealNext}
          disabled={isLoading || !steps}
          className="w-full gap-2"
        >
          <ChevronRight className="w-4 h-4" />
          Reveal Next Step
          <Badge variant="secondary" className="ml-auto">
            {revealedCount + 1}/{totalSteps}
          </Badge>
        </Button>
      ) : revealedCount > 0 ? (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">All steps revealed</span>
        </div>
      ) : null}
    </div>
  );
}
