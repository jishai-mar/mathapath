import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingCompleteProps {
  title: string;
  subtitle: string;
  onContinue: () => void;
  onAdjustPreferences?: () => void;
}

export default function OnboardingComplete({
  title,
  subtitle,
  onContinue,
  onAdjustPreferences,
}: OnboardingCompleteProps) {
  return (
    <div className="text-center space-y-8">
      {/* Hero visual */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative mx-auto"
      >
        {/* Glowing orb background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-primary/20 blur-3xl animate-pulse-slow" />
        </div>
        
        {/* Main icon container */}
        <div className="relative w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Sparkles className="w-16 h-16 text-primary" />
          </motion.div>
        </div>
        
        {/* Floating accent */}
        <motion.div
          className="absolute -top-2 -right-2 w-12 h-12 rounded-xl bg-primary/30 backdrop-blur-sm border border-primary/50 flex items-center justify-center"
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-6 h-6 text-primary" />
        </motion.div>
      </motion.div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-4"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
          {subtitle}
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="space-y-4 pt-4"
      >
        <Button
          onClick={onContinue}
          size="lg"
          className="w-full max-w-xs mx-auto py-6 text-lg font-semibold shadow-primary-glow-lg hover:shadow-primary-glow transition-shadow"
        >
          Enter Learning Space
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        {onAdjustPreferences && (
          <button
            onClick={onAdjustPreferences}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Adjust preferences
          </button>
        )}
      </motion.div>
    </div>
  );
}
