import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HybridTutorPanel } from './HybridTutorPanel';
import { HelpCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NeedHelpButtonProps {
  variant?: 'floating' | 'inline';
  className?: string;
}

export function NeedHelpButton({ variant = 'inline', className = '' }: NeedHelpButtonProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  if (variant === 'floating') {
    return (
      <>
        <AnimatePresence>
          {!isPanelOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed bottom-24 right-6 z-40"
            >
              <Button
                onClick={() => setIsPanelOpen(true)}
                size="lg"
                className="rounded-full h-14 px-6 shadow-lg gap-2 bg-secondary hover:bg-secondary/90"
              >
                <MessageCircle className="w-5 h-5" />
                Hulp nodig?
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <HybridTutorPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsPanelOpen(true)}
        className={`gap-2 ${className}`}
      >
        <HelpCircle className="w-4 h-4" />
        Hulp nodig?
      </Button>

      <HybridTutorPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
