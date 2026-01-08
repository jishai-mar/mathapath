import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useTutor } from '@/contexts/TutorContext';
import { TutorAvatar } from './TutorAvatar';
import { GlobalTutorChat } from './GlobalTutorChat';
import { cn } from '@/lib/utils';

export function GlobalTutorButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { preferences } = useTutor();

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "w-14 h-14 rounded-full",
              "bg-primary text-primary-foreground",
              "shadow-lg shadow-primary/25",
              "flex items-center justify-center",
              "hover:shadow-xl hover:shadow-primary/30",
              "transition-shadow duration-200"
            )}
            aria-label={`Chat with ${preferences.tutorName}`}
          >
            <div className="relative">
              <TutorAvatar 
                style={preferences.avatarStyle} 
                mood="idle" 
                size="sm" 
              />
              {/* Chat indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-primary flex items-center justify-center">
                <MessageCircle className="w-2 h-2 text-white" />
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <GlobalTutorChat 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
