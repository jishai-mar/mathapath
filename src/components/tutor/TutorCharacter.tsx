import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Easing } from 'framer-motion';
import { cn } from '@/lib/utils';

export type TutorMood = 
  | 'idle'
  | 'thinking'
  | 'happy'
  | 'celebrating'
  | 'encouraging'
  | 'curious'
  | 'explaining';

interface TutorCharacterProps {
  mood?: TutorMood;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSpeechBubble?: boolean;
}

const easeInOut: Easing = 'easeInOut';

const celebrationMessages = [
  "Amazing! 🎉",
  "You got it! ⭐",
  "Brilliant! 🌟",
  "Perfect! 💫",
  "Nailed it! 🔥",
  "Awesome! ✨",
  "Great job! 🏆",
];

const encouragementMessages = [
  "Keep going!",
  "You can do it!",
  "Almost there!",
  "Try again!",
  "Don't give up!",
  "Stay focused!",
];

const moodConfig = {
  idle: {
    eyeAnimation: { y: [0, -1, 0], transition: { duration: 3, repeat: Infinity } },
    bodyAnimation: { y: [0, -2, 0], transition: { duration: 4, repeat: Infinity, ease: easeInOut } },
    color: 'from-primary/80 to-primary',
  },
  thinking: {
    eyeAnimation: { x: [0, 3, -3, 0], transition: { duration: 2, repeat: Infinity } },
    bodyAnimation: { rotate: [-2, 2, -2], transition: { duration: 1.5, repeat: Infinity } },
    color: 'from-amber-400 to-amber-500',
  },
  happy: {
    eyeAnimation: { scaleY: [1, 0.3, 1], transition: { duration: 0.3, repeat: 2 } },
    bodyAnimation: { scale: [1, 1.05, 1], transition: { duration: 0.5, repeat: 2 } },
    color: 'from-green-400 to-green-500',
  },
  celebrating: {
    eyeAnimation: { scaleY: 0.2 },
    bodyAnimation: { 
      y: [0, -8, 0], 
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.6, repeat: Infinity } 
    },
    color: 'from-primary to-green-400',
  },
  encouraging: {
    eyeAnimation: { scale: [1, 1.1, 1], transition: { duration: 1, repeat: Infinity } },
    bodyAnimation: { y: [0, -3, 0], transition: { duration: 1.5, repeat: Infinity, ease: easeInOut } },
    color: 'from-blue-400 to-primary',
  },
  curious: {
    eyeAnimation: { scale: 1.2 },
    bodyAnimation: { rotate: [0, 8, 0], transition: { duration: 2, repeat: Infinity } },
    color: 'from-purple-400 to-primary',
  },
  explaining: {
    eyeAnimation: { y: [0, -1, 0], transition: { duration: 2, repeat: Infinity } },
    bodyAnimation: { x: [0, 2, -2, 0], transition: { duration: 3, repeat: Infinity } },
    color: 'from-primary/90 to-primary',
  },
};

const sizeConfig = {
  sm: { container: 'w-10 h-10', body: 'w-8 h-8', eye: 'w-1.5 h-2', eyeGap: 'gap-1.5' },
  md: { container: 'w-14 h-14', body: 'w-11 h-11', eye: 'w-2 h-2.5', eyeGap: 'gap-2' },
  lg: { container: 'w-20 h-20', body: 'w-16 h-16', eye: 'w-3 h-4', eyeGap: 'gap-3' },
};

export default function TutorCharacter({ 
  mood = 'idle', 
  size = 'sm',
  className,
  showSpeechBubble = true
}: TutorCharacterProps) {
  const config = moodConfig[mood];
  const sizes = sizeConfig[size];
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (mood === 'celebrating') {
      setMessage(celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]);
    } else if (mood === 'encouraging') {
      setMessage(encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]);
    } else {
      setMessage('');
    }
  }, [mood]);

  const showBubble = showSpeechBubble && (mood === 'celebrating' || mood === 'encouraging') && message;

  return (
    <motion.div 
      className={cn("relative flex items-center justify-center", sizes.container, className)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              "absolute -top-10 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap",
              "px-2.5 py-1 rounded-lg text-xs font-medium shadow-lg",
              mood === 'celebrating' 
                ? "bg-green-500 text-white" 
                : "bg-blue-500 text-white"
            )}
          >
            {message}
            {/* Speech bubble tail */}
            <div 
              className={cn(
                "absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45",
                mood === 'celebrating' ? "bg-green-500" : "bg-blue-500"
              )} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glow effect */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br blur-md opacity-50",
          config.color
        )}
        animate={config.bodyAnimation}
      />
      
      {/* Body */}
      <motion.div
        className={cn(
          "relative rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
          config.color,
          sizes.body
        )}
        animate={config.bodyAnimation}
      >
        {/* Face */}
        <div className={cn("flex items-center", sizes.eyeGap)}>
          {/* Left eye */}
          <motion.div
            className={cn("bg-white rounded-full", sizes.eye)}
            animate={config.eyeAnimation}
          />
          {/* Right eye */}
          <motion.div
            className={cn("bg-white rounded-full", sizes.eye)}
            animate={config.eyeAnimation}
          />
        </div>
        
        {/* Mouth based on mood */}
        <AnimatePresence mode="wait">
          {(mood === 'happy' || mood === 'celebrating') && (
            <motion.div
              key="smile"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute bottom-[22%] w-3 h-1.5 border-b-2 border-white rounded-b-full"
            />
          )}
          {mood === 'curious' && (
            <motion.div
              key="o-mouth"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute bottom-[20%] w-1.5 h-1.5 bg-white rounded-full"
            />
          )}
        </AnimatePresence>

        {/* Sparkles for celebrating */}
        {mood === 'celebrating' && (
          <>
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full"
              animate={{ 
                scale: [0, 1, 0], 
                opacity: [0, 1, 0],
                y: [-5, -10],
              }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="absolute -top-2 left-0 w-1.5 h-1.5 bg-green-300 rounded-full"
              animate={{ 
                scale: [0, 1, 0], 
                opacity: [0, 1, 0],
                y: [-5, -12],
              }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div
              className="absolute top-0 -left-1 w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ 
                scale: [0, 1, 0], 
                opacity: [0, 1, 0],
                y: [-3, -8],
              }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
            />
          </>
        )}

        {/* Thinking dots */}
        {mood === 'thinking' && (
          <motion.div
            className="absolute -top-3 -right-2 flex gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 bg-white/80 rounded-full"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
