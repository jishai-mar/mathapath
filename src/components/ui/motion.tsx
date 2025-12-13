'use client';

import { motion, HTMLMotionProps, Transition } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

// Animation presets for consistent feel
export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
};

export const transition: Record<string, Transition> = {
  default: { duration: 0.5, ease: 'easeOut' },
  fast: { duration: 0.3, ease: 'easeOut' },
  slow: { duration: 0.7, ease: 'easeOut' },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  bounce: { type: 'spring', stiffness: 400, damping: 25 },
};

// Stagger children animations
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Motion wrapper components
interface MotionDivProps extends HTMLMotionProps<'div'> {
  className?: string;
}

export const FadeIn = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={transition.default}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FadeIn.displayName = 'FadeIn';

export const ScaleIn = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={transition.default}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
ScaleIn.displayName = 'ScaleIn';

// Page transition wrapper
export const PageTransition = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={transition.fast}
    className={className}
  >
    {children}
  </motion.div>
);

// Hover card effect
export const HoverCard = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={transition.fast}
      className={cn('premium-card', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
);
HoverCard.displayName = 'HoverCard';

// Animated counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export const AnimatedCounter = ({ value, duration = 2, className, suffix = '', prefix = '' }: AnimatedCounterProps) => (
  <motion.span
    className={className}
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
  >
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {value}
      </motion.span>
      {suffix}
    </motion.span>
  </motion.span>
);

// Animated progress bar
interface AnimatedProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  showValue?: boolean;
}

export const AnimatedProgress = ({ value, className, barClassName, showValue }: AnimatedProgressProps) => (
  <div className={cn('relative h-2 bg-muted rounded-full overflow-hidden', className)}>
    <motion.div
      className={cn('h-full bg-primary rounded-full', barClassName)}
      initial={{ width: 0 }}
      whileInView={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
    />
    {showValue && (
      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pr-1">
        {value}%
      </span>
    )}
  </div>
);

// Floating animation wrapper
export const Float = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -15, 0],
      rotate: [0, 2, 0],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
  >
    {children}
  </motion.div>
);
