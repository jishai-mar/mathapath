import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, CheckCircle2, ChevronDown, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import MathRenderer from '@/components/MathRenderer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import type { WorkedExampleBlock as WorkedExampleBlockType, SolutionStep } from '../types/blocks';

interface WorkedExampleBlockNewProps {
  block: WorkedExampleBlockType;
  showBlockNumber?: boolean;
}

const difficultyColors = {
  basic: 'bg-green-500/20 text-green-600 dark:text-green-400',
  intermediate: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  advanced: 'bg-red-500/20 text-red-600 dark:text-red-400',
};

export function WorkedExampleBlockNew({ block, showBlockNumber = true }: WorkedExampleBlockNewProps) {
  const [solutionOpen, setSolutionOpen] = useState(true);
  const [errorsOpen, setErrorsOpen] = useState(false);
  const { content } = block;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-card rounded-xl border-l-4 border-l-orange-500 border border-border shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-orange-500/5 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <PenLine className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {showBlockNumber && block.blockNumber && (
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded">
                {block.blockNumber}
              </span>
            )}
            <h3 className="font-semibold text-foreground">Worked Example</h3>
            <Badge variant="secondary" className={difficultyColors[content.difficulty]}>
              {content.difficulty}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{block.title}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Problem Statement */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Problem</h4>
          <MathRenderer latex={content.problem} displayMode className="text-foreground" />
        </div>

        {/* Concepts Applied */}
        {content.conceptsApplied.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Uses:</span>
            {content.conceptsApplied.map((concept, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs font-mono bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded border border-orange-500/20"
              >
                {concept}
              </span>
            ))}
          </div>
        )}

        {/* Solution Steps */}
        <Collapsible open={solutionOpen} onOpenChange={setSolutionOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-orange-500/10 hover:bg-orange-500/15 rounded-lg border border-orange-500/20 transition-colors">
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Solution</span>
            <ChevronDown className={`w-4 h-4 ml-auto text-orange-500 transition-transform ${solutionOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <AnimatePresence>
              {solutionOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-3"
                >
                  {content.solution.map((step: SolutionStep) => (
                    <motion.div
                      key={step.stepNumber}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: step.stepNumber * 0.05 }}
                      className="flex gap-4 p-4 bg-muted/30 rounded-lg border border-border"
                    >
                      <div className="flex-shrink-0">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold">
                          {step.stepNumber}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="font-medium text-foreground">{step.action}</p>
                        <div className="p-3 bg-background rounded border border-border">
                          <MathRenderer latex={step.calculation} displayMode className="text-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Justification:</span>{' '}
                          <span className="text-orange-600 dark:text-orange-400">
                            {step.justification}
                            {step.theoryBlockReference && (
                              <span className="ml-1 font-mono text-xs">({step.theoryBlockReference})</span>
                            )}
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Final Answer */}
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400">Final Answer</span>
                      <div className="mt-1">
                        <MathRenderer 
                          latex={content.solution[content.solution.length - 1]?.calculation || ''} 
                          displayMode 
                          className="text-foreground" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Verification */}
                  {content.verification && (
                    <div className="p-3 bg-muted/30 rounded-lg border border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Verification
                      </h4>
                      <MathRenderer latex={content.verification} className="text-foreground text-sm" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>

        {/* Common Errors */}
        {content.commonErrors && content.commonErrors.length > 0 && (
          <Collapsible open={errorsOpen} onOpenChange={setErrorsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-destructive/10 hover:bg-destructive/15 rounded-lg border border-destructive/20 transition-colors">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Common Mistakes</span>
              <ChevronDown className={`w-4 h-4 ml-auto text-destructive transition-transform ${errorsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <AnimatePresence>
                {errorsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-4 bg-destructive/5 rounded-lg border border-destructive/10"
                  >
                    <ul className="space-y-2">
                      {content.commonErrors.map((error, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-destructive font-medium">✗</span>
                          <span className="text-sm text-foreground">{error}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </motion.section>
  );
}
