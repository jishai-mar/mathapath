import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type AvatarStyle = 'friendly-robot' | 'wise-owl' | 'abstract-orb' | 'cartoon-professor' | 'helpful-fox';
export type TutorMood = 'idle' | 'thinking' | 'happy' | 'celebrating' | 'encouraging' | 'curious' | 'explaining';

interface TutorAvatarProps {
  style: AvatarStyle;
  mood?: TutorMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSpeechBubble?: boolean;
  equippedAccessory?: string;
  equippedOutfit?: string;
  equippedBackground?: string;
  equippedEffect?: string;
}

const sizeConfig = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

const backgroundSizeConfig = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-36 h-36',
};

const moodAnimations = {
  idle: { scale: [1, 1.02, 1], transition: { duration: 3, repeat: Infinity } },
  thinking: { rotate: [0, -5, 5, 0], transition: { duration: 2, repeat: Infinity } },
  happy: { scale: [1, 1.1, 1], transition: { duration: 0.5 } },
  celebrating: { y: [0, -10, 0], scale: [1, 1.15, 1], transition: { duration: 0.6, repeat: 2 } },
  encouraging: { scale: [1, 1.05, 1], transition: { duration: 1.5, repeat: Infinity } },
  curious: { rotate: [0, 10, 0], transition: { duration: 1.5, repeat: Infinity } },
  explaining: { x: [0, 3, -3, 0], transition: { duration: 2, repeat: Infinity } },
};

const celebrationMessages = [
  "Amazing! 🎉",
  "You got it! ⭐",
  "Brilliant! 🌟",
  "Perfect! 💫",
  "Excellent! 🏆",
];

const encouragementMessages = [
  "You can do this!",
  "Keep trying!",
  "Almost there!",
  "Don't give up!",
  "Let's figure this out together!",
];

// Background styles
const backgroundStyles: Record<string, string> = {
  'notebook': 'bg-gradient-to-br from-amber-100/30 to-amber-200/30 dark:from-amber-900/20 dark:to-amber-800/20',
  'chalkboard': 'bg-gradient-to-br from-slate-700/30 to-slate-800/30',
  'library': 'bg-gradient-to-br from-amber-800/30 to-amber-900/30',
  'stars': 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40',
  'space': 'bg-gradient-to-br from-slate-900/50 to-indigo-900/50',
  'galaxy': 'bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-indigo-900/50',
};

// Accessory components
const AccessoryOverlay = ({ type, size }: { type: string; size: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizeScale = { sm: 0.4, md: 0.6, lg: 0.8, xl: 1 };
  const scale = sizeScale[size];
  
  const accessories: Record<string, React.ReactNode> = {
    'glasses': (
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2" style={{ transform: `translateX(-50%) scale(${scale})` }}>
        <div className="flex gap-1">
          <div className="w-4 h-3 rounded-full border-2 border-slate-700 dark:border-slate-300" />
          <div className="w-4 h-3 rounded-full border-2 border-slate-700 dark:border-slate-300" />
        </div>
      </div>
    ),
    'graduation-cap': (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2" style={{ transform: `translateX(-50%) scale(${scale})` }}>
        <div className="w-8 h-2 bg-slate-800 dark:bg-slate-200 rounded-sm" />
        <div className="w-6 h-4 bg-slate-800 dark:bg-slate-200 mx-auto -mt-1" />
        <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-amber-500" />
        <div className="absolute -top-1 left-1/2 w-2 h-2 bg-amber-500 rounded-full -translate-x-1/2" />
      </div>
    ),
    'crown': (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2" style={{ transform: `translateX(-50%) scale(${scale})` }}>
        <div className="relative">
          <div className="w-10 h-4 bg-gradient-to-b from-amber-400 to-amber-500 rounded-b-sm" />
          <div className="absolute -top-2 left-0 w-2 h-4 bg-gradient-to-b from-amber-400 to-amber-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-5 bg-gradient-to-b from-amber-400 to-amber-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          <div className="absolute -top-2 right-0 w-2 h-4 bg-gradient-to-b from-amber-400 to-amber-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        </div>
      </div>
    ),
    'halo': (
      <motion.div 
        className="absolute -top-4 left-1/2 -translate-x-1/2"
        style={{ transform: `translateX(-50%) scale(${scale})` }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-10 h-3 rounded-full border-2 border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/50" />
      </motion.div>
    ),
    'headphones': (
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-full" style={{ transform: `translateX(-50%) scale(${scale})` }}>
        <div className="relative">
          <div className="absolute top-2 -left-1 w-3 h-4 bg-slate-700 dark:bg-slate-300 rounded-l-full" />
          <div className="absolute top-2 -right-1 w-3 h-4 bg-slate-700 dark:bg-slate-300 rounded-r-full" />
          <div className="w-full h-2 bg-slate-700 dark:bg-slate-300 rounded-t-full" />
        </div>
      </div>
    ),
    'badge': (
      <div className="absolute bottom-0 right-0" style={{ transform: `scale(${scale})` }}>
        <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
          <span className="text-[8px]">⭐</span>
        </div>
      </div>
    ),
  };
  
  return accessories[type] || null;
};

// Effect overlays
const EffectOverlay = ({ type, size }: { type: string; size: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const effects: Record<string, React.ReactNode> = {
    'sparkle': (
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="absolute top-0 right-0 text-xs">✨</span>
        <span className="absolute bottom-1 left-0 text-xs">✨</span>
      </motion.div>
    ),
    'glow': (
      <motion.div 
        className="absolute inset-0 rounded-full bg-primary/20 blur-md -z-10"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    ),
    'rainbow': (
      <motion.div 
        className="absolute inset-0 rounded-full -z-10"
        style={{ background: 'conic-gradient(from 0deg, red, orange, yellow, green, blue, indigo, violet, red)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-1 rounded-full bg-background" />
      </motion.div>
    ),
    'lightning': (
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <span className="absolute -top-1 -right-1 text-yellow-400">⚡</span>
      </motion.div>
    ),
    'fire': (
      <motion.div 
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 pointer-events-none"
        animate={{ y: [0, -2, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <span className="text-orange-500">🔥</span>
      </motion.div>
    ),
    'numbers': (
      <motion.div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute text-[10px] text-primary/50"
            style={{ left: `${20 + i * 30}%` }}
            animate={{ y: [20, -20], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
          >
            {['π', '∑', '∞'][i]}
          </motion.span>
        ))}
      </motion.div>
    ),
  };
  
  return effects[type] || null;
};

// Friendly Robot Avatar
const FriendlyRobot = ({ mood, size }: { mood: TutorMood; size: string }) => (
  <div className={cn("relative rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center", size)}>
    <motion.div
      className="absolute inset-2 rounded-full bg-gradient-to-br from-background to-muted border-2 border-primary/30"
      animate={moodAnimations[mood]}
    >
      {/* Eyes */}
      <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-primary">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary"
          animate={mood === 'thinking' ? { scale: [1, 0.5, 1] } : { scale: 1 }}
          transition={{ duration: 1, repeat: mood === 'thinking' ? Infinity : 0 }}
        />
      </div>
      <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-primary">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary"
          animate={mood === 'thinking' ? { scale: [1, 0.5, 1] } : { scale: 1 }}
          transition={{ duration: 1, repeat: mood === 'thinking' ? Infinity : 0, delay: 0.1 }}
        />
      </div>
      {/* Mouth */}
      <motion.div
        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 h-1 bg-primary rounded-full"
        animate={{
          width: mood === 'happy' || mood === 'celebrating' ? '40%' : '20%',
          borderRadius: mood === 'happy' || mood === 'celebrating' ? '0 0 10px 10px' : '10px',
        }}
      />
      {/* Antenna */}
      <motion.div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-primary rounded-full"
        animate={mood === 'celebrating' ? { rotate: [0, 20, -20, 0] } : {}}
        transition={{ duration: 0.5, repeat: mood === 'celebrating' ? 3 : 0 }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
      </motion.div>
    </motion.div>
  </div>
);

// Wise Owl Avatar
const WiseOwl = ({ mood, size }: { mood: TutorMood; size: string }) => (
  <div className={cn("relative rounded-full bg-gradient-to-br from-amber-900/30 to-amber-700/30 flex items-center justify-center", size)}>
    <motion.div
      className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800"
      animate={moodAnimations[mood]}
    >
      {/* Big Eyes */}
      <div className="absolute top-1/4 left-1/5 w-3 h-3 rounded-full bg-amber-950 border-2 border-amber-400">
        <motion.div
          className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white"
          animate={mood === 'curious' ? { x: [0, 2, 0] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
      <div className="absolute top-1/4 right-1/5 w-3 h-3 rounded-full bg-amber-950 border-2 border-amber-400">
        <motion.div
          className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-white"
          animate={mood === 'curious' ? { x: [0, -2, 0] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
      {/* Beak */}
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-amber-600" />
      {/* Ear tufts */}
      <div className="absolute -top-1 left-1/4 w-2 h-3 bg-amber-700 dark:bg-amber-600 rounded-t-full rotate-[-20deg]" />
      <div className="absolute -top-1 right-1/4 w-2 h-3 bg-amber-700 dark:bg-amber-600 rounded-t-full rotate-[20deg]" />
    </motion.div>
  </div>
);

// Abstract Orb Avatar
const AbstractOrb = ({ mood, size }: { mood: TutorMood; size: string }) => (
  <div className={cn("relative rounded-full flex items-center justify-center", size)}>
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/50 via-fuchsia-500/50 to-cyan-500/50 blur-sm"
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <motion.div
      className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400"
      animate={moodAnimations[mood]}
    >
      {/* Inner glow */}
      <motion.div
        className="absolute inset-2 rounded-full bg-white/20"
        animate={{
          opacity: mood === 'celebrating' ? [0.2, 0.6, 0.2] : [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {/* Core */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-white/60"
        animate={mood === 'thinking' ? { scale: [1, 0.8, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.div>
  </div>
);

// Cartoon Professor Avatar
const CartoonProfessor = ({ mood, size }: { mood: TutorMood; size: string }) => (
  <div className={cn("relative rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center", size)}>
    <motion.div
      className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-900 dark:to-orange-800"
      animate={moodAnimations[mood]}
    >
      {/* Hair */}
      <div className="absolute -top-1 left-1/4 right-1/4 h-3 bg-slate-500 dark:bg-slate-400 rounded-t-full" />
      {/* Glasses */}
      <div className="absolute top-1/3 left-1/6 w-3 h-2 rounded-full border-2 border-slate-700 dark:border-slate-300 bg-white/20" />
      <div className="absolute top-1/3 right-1/6 w-3 h-2 rounded-full border-2 border-slate-700 dark:border-slate-300 bg-white/20" />
      <div className="absolute top-[38%] left-1/2 -translate-x-1/2 w-2 h-0.5 bg-slate-700 dark:bg-slate-300" />
      {/* Eyes behind glasses */}
      <motion.div
        className="absolute top-[36%] left-[22%] w-1.5 h-1.5 rounded-full bg-slate-800"
        animate={mood === 'happy' ? { scaleY: 0.3 } : {}}
      />
      <motion.div
        className="absolute top-[36%] right-[22%] w-1.5 h-1.5 rounded-full bg-slate-800"
        animate={mood === 'happy' ? { scaleY: 0.3 } : {}}
      />
      {/* Smile */}
      <motion.div
        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-slate-700 dark:border-slate-300 rounded-b-full"
        animate={{
          scaleX: mood === 'happy' || mood === 'celebrating' ? 1.2 : 1,
        }}
      />
      {/* Mustache */}
      <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 w-5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-full" />
    </motion.div>
  </div>
);

// Helpful Fox Avatar
const HelpfulFox = ({ mood, size }: { mood: TutorMood; size: string }) => (
  <div className={cn("relative rounded-full bg-gradient-to-br from-orange-400/30 to-orange-600/30 flex items-center justify-center", size)}>
    <motion.div
      className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-400 to-orange-500"
      animate={moodAnimations[mood]}
    >
      {/* Ears */}
      <div className="absolute -top-2 left-1/5 w-3 h-4 bg-orange-500 rounded-t-full rotate-[-15deg]">
        <div className="absolute inset-1 bg-orange-200 rounded-t-full" />
      </div>
      <div className="absolute -top-2 right-1/5 w-3 h-4 bg-orange-500 rounded-t-full rotate-[15deg]">
        <div className="absolute inset-1 bg-orange-200 rounded-t-full" />
      </div>
      {/* White face patch */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-orange-100 rounded-b-full" />
      {/* Eyes */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-amber-900"
        animate={mood === 'happy' ? { scaleY: 0.3 } : {}}
      >
        <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-white" />
      </motion.div>
      <motion.div
        className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-amber-900"
        animate={mood === 'happy' ? { scaleY: 0.3 } : {}}
      >
        <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 rounded-full bg-white" />
      </motion.div>
      {/* Nose */}
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-amber-900 rounded-full" />
      {/* Mouth */}
      <motion.div
        className="absolute bottom-1/5 left-1/2 -translate-x-1/2 w-3 h-1"
        animate={{
          scaleX: mood === 'happy' || mood === 'celebrating' ? 1.3 : 1,
        }}
      >
        <div className="absolute bottom-0 left-0 w-1/2 h-full border-b-2 border-amber-900 rounded-bl-full" />
        <div className="absolute bottom-0 right-0 w-1/2 h-full border-b-2 border-amber-900 rounded-br-full" />
      </motion.div>
    </motion.div>
  </div>
);

const avatarComponents: Record<AvatarStyle, React.FC<{ mood: TutorMood; size: string }>> = {
  'friendly-robot': FriendlyRobot,
  'wise-owl': WiseOwl,
  'abstract-orb': AbstractOrb,
  'cartoon-professor': CartoonProfessor,
  'helpful-fox': HelpfulFox,
};

export const avatarOptions: { style: AvatarStyle; name: string; description: string }[] = [
  { style: 'friendly-robot', name: 'Friendly Robot', description: 'Tech-savvy and approachable' },
  { style: 'wise-owl', name: 'Wise Owl', description: 'Scholarly and patient' },
  { style: 'abstract-orb', name: 'Abstract Orb', description: 'Calming and mystical' },
  { style: 'cartoon-professor', name: 'Cartoon Professor', description: 'Classic and knowledgeable' },
  { style: 'helpful-fox', name: 'Helpful Fox', description: 'Playful and encouraging' },
];

export function TutorAvatar({ 
  style, 
  mood = 'idle', 
  size = 'md', 
  className, 
  showSpeechBubble,
  equippedAccessory,
  equippedOutfit,
  equippedBackground,
  equippedEffect
}: TutorAvatarProps) {
  const AvatarComponent = avatarComponents[style] || FriendlyRobot;
  const sizeClass = sizeConfig[size];
  const bgSizeClass = backgroundSizeConfig[size];

  const getMessage = () => {
    if (mood === 'celebrating') {
      return celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
    }
    if (mood === 'encouraging') {
      return encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    }
    return null;
  };

  const bgStyle = equippedBackground ? backgroundStyles[equippedBackground] : '';

  return (
    <div className={cn("relative", className)}>
      {/* Background layer */}
      {equippedBackground && (
        <div className={cn(
          "absolute inset-0 rounded-full -z-10 flex items-center justify-center",
          bgSizeClass,
          bgStyle
        )} style={{ margin: '-8%' }} />
      )}
      
      {/* Effect layer (behind avatar) */}
      {equippedEffect && <EffectOverlay type={equippedEffect} size={size} />}
      
      {/* Main avatar */}
      <AvatarComponent mood={mood} size={sizeClass} />
      
      {/* Accessory layer (on top) */}
      {equippedAccessory && <AccessoryOverlay type={equippedAccessory} size={size} />}
      
      {showSpeechBubble && (mood === 'celebrating' || mood === 'encouraging') && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap shadow-lg"
        >
          {getMessage()}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border rotate-45" />
        </motion.div>
      )}
    </div>
  );
}
