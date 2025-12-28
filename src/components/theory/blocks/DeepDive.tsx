import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { DeepDiveBlock, DeepDiveQuestion } from '../types';

interface DeepDiveProps {
  block: DeepDiveBlock;
}

function DeepDiveItem({ question, answer }: DeepDiveQuestion) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 py-3 text-left group"
      >
        <HelpCircle className="w-4 h-4 text-info shrink-0" />
        <span className="flex-1 text-info hover:text-info/80 transition-colors text-sm">
          {question}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-7 pr-4">
              <div className="text-sm text-muted-foreground leading-relaxed">
                <MathRenderer latex={answer} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DeepDive({ block }: DeepDiveProps) {
  if (!block.questions || block.questions.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="space-y-2"
    >
      <div className="rounded-lg border border-border/30 divide-y divide-border/30 bg-muted/20">
        {block.questions.map((q, index) => (
          <DeepDiveItem key={index} {...q} />
        ))}
      </div>
    </motion.section>
  );
}
