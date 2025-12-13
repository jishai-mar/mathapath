import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center';
  gradient?: boolean;
}

export function SectionHeader({ 
  title, 
  subtitle, 
  className, 
  align = 'center',
  gradient = false 
}: SectionHeaderProps) {
  return (
    <motion.div 
      className={cn(
        'space-y-3',
        align === 'center' && 'text-center',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className={cn(
        'text-3xl sm:text-4xl font-bold tracking-tight',
        gradient && 'gradient-text'
      )}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  index?: number;
}

export function FeatureCard({ icon: Icon, title, description, className, index = 0 }: FeatureCardProps) {
  return (
    <motion.div
      className={cn(
        'group relative p-6 rounded-2xl bg-card/50 border border-border/50',
        'hover:bg-card/80 hover:border-border transition-all duration-300',
        'premium-card',
        className
      )}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

interface StepCardProps {
  step: number;
  title: string;
  description: string;
  icon?: LucideIcon;
  index?: number;
}

export function StepCard({ step, title, description, icon: Icon, index = 0 }: StepCardProps) {
  return (
    <motion.div
      className="relative flex gap-4"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          {step}
        </div>
        {index < 3 && (
          <div className="w-0.5 h-full bg-gradient-to-b from-primary/50 to-transparent mt-2" />
        )}
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

interface StatPillProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatPill({ value, label, icon: Icon, className }: StatPillProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-border/50',
      className
    )}>
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div className={cn(
      'glass rounded-2xl p-6',
      hover && 'premium-card cursor-pointer',
      className
    )}>
      {children}
    </div>
  );
}

// Animated background orbs for hero sections
export function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(16 85% 60% / 0.12) 0%, transparent 70%)',
          top: '-20%',
          left: '-10%',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(210 100% 60% / 0.08) 0%, transparent 70%)',
          bottom: '-10%',
          right: '-5%',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
