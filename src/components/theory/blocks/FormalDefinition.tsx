import { motion } from 'framer-motion';
import { FunctionSquare } from 'lucide-react';
import { TheoryMathRenderer } from '../TheoryMathRenderer';
import { FormalDefinitionBlock } from '../types';

interface FormalDefinitionProps {
  block: FormalDefinitionBlock;
}

export function FormalDefinition({ block }: FormalDefinitionProps) {
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
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
          <FunctionSquare className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Formal Definition</h2>
      </div>

      {/* Content */}
      <div className="text-muted-foreground leading-relaxed">
        <TheoryMathRenderer content={block.content} />
      </div>

      {/* Formula box */}
      {block.formula && (
        <div className="relative overflow-hidden rounded-xl bg-muted/50 border border-border/50 p-6">
          <div className="text-center text-lg">
            <TheoryMathRenderer content={block.formula} displayMode />
          </div>
        </div>
      )}

      {/* Optional note */}
      {block.note && (
        <p className="text-sm text-muted-foreground/80 italic">
          {block.note}
        </p>
      )}
    </motion.section>
  );
}
