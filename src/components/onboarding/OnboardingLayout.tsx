import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBack?: boolean;
}

export default function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  showBack = true,
}: OnboardingLayoutProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Radial gradient background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsla(145, 76%, 30%, 0.15) 0%, transparent 60%)',
        }}
      />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-primary/3 blur-3xl animate-float-slow" />
      
      {/* Content wrapper */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-border/20 z-50">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between">
          {showBack && onBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground -ml-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}
          
          <span className="text-sm text-muted-foreground">
            {currentStep} of {totalSteps}
          </span>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-2xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
