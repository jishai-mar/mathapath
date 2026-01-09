import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { TheoryMathRenderer } from '../TheoryMathRenderer';
import { IntuitiveExplanationBlock } from '../types';

interface IntuitiveExplanationProps {
  block: IntuitiveExplanationBlock;
}

export function IntuitiveExplanation({ block }: IntuitiveExplanationProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
          <Lightbulb className="w-3.5 h-3.5 text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {block.title || 'Intuitive Breakdown'}
        </h2>
      </div>

      {/* Paragraphs */}
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        {block.paragraphs.map((paragraph, index) => (
          <div key={index}>
            <TheoryMathRenderer content={paragraph} />
          </div>
        ))}
      </div>

      {/* Metaphor callout */}
      {block.metaphor && (
        <div className="relative pl-4 border-l-2 border-accent/30">
          <p className="text-sm text-accent/90 italic">
            {block.metaphor}
          </p>
        </div>
      )}
    </motion.section>
  );
}
