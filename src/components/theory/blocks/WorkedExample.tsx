import { motion } from 'framer-motion';
import { PenLine, CheckCircle2 } from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { WorkedExampleBlock } from '../types';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';

interface WorkedExampleProps {
  block: WorkedExampleBlock;
}

export function WorkedExample({ block }: WorkedExampleProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-secondary/10 flex items-center justify-center">
          <PenLine className="w-3.5 h-3.5 text-secondary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {block.title || 'Worked Example'}
        </h2>
      </div>

      {/* Problem statement */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
        <p className="text-sm text-muted-foreground/80 mb-2">Problem:</p>
        <div className="text-foreground">
          <MathRenderer segments={createSegmentsFromSolution(block.problem)} />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {block.steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex gap-4 ${step.highlight ? 'relative' : ''}`}
          >
            {/* Step number */}
            <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
              step.highlight 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>

            {/* Step content */}
            <div className="flex-1 space-y-2">
              <p className="text-muted-foreground">
                <MathRenderer segments={createSegmentsFromSolution(step.explanation)} />
              </p>
              {step.math && (
                <div className={`pl-4 py-2 border-l-2 ${
                  step.highlight ? 'border-primary/50' : 'border-border/50'
                }`}>
                  <MathRenderer segments={createSegmentsFromSolution(step.math)} />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Final answer */}
      {block.finalAnswer && (
        <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
          <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
          <div className="flex-1">
            <span className="text-sm text-muted-foreground">Answer: </span>
            <span className="text-foreground font-medium">
              <MathRenderer segments={createSegmentsFromSolution(block.finalAnswer)} />
            </span>
          </div>
        </div>
      )}
    </motion.section>
  );
}
