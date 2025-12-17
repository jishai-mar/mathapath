import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MathRenderer from '@/components/MathRenderer';
import { Bot, CheckCircle2, XCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepType = 
  | 'greeting'
  | 'question'
  | 'explanation'
  | 'formula'
  | 'example'
  | 'understanding-check'
  | 'hint'
  | 'encouragement'
  | 'transition';

export interface ConversationalStepData {
  type: StepType;
  content: string;
  checkQuestion?: string;
  checkAnswer?: string;
  checkHint?: string;
  options?: string[];
  formula?: string;
  isComplete?: boolean;
}

export interface CheckResponseData {
  checkQuestion: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  attempts: number;
  hintUsed: boolean;
  timeSpentSeconds: number;
}

interface ConversationalStepProps {
  step: ConversationalStepData;
  onComplete: () => void;
  onNeedHelp?: () => void;
  onCheckComplete?: (data: CheckResponseData) => void;
  isActive: boolean;
  stepIndex: number;
}

export default function ConversationalStep({ 
  step, 
  onComplete, 
  onNeedHelp,
  onCheckComplete,
  isActive,
  stepIndex 
}: ConversationalStepProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isActive && step.type === 'understanding-check') {
      startTimeRef.current = Date.now();
    }
  }, [isActive, step.type]);

  const reportCheckResponse = (answer: string, correct: boolean, attemptCount: number) => {
    if (onCheckComplete && step.checkQuestion && step.checkAnswer) {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      onCheckComplete({
        checkQuestion: step.checkQuestion,
        userAnswer: answer,
        correctAnswer: step.checkAnswer,
        isCorrect: correct,
        attempts: attemptCount,
        hintUsed: showHint,
        timeSpentSeconds: timeSpent,
      });
    }
  };

  const checkAnswer = () => {
    if (!step.checkAnswer) return;
    
    const normalizedUser = userAnswer.toLowerCase().trim().replace(/\s+/g, '');
    const normalizedCorrect = step.checkAnswer.toLowerCase().trim().replace(/\s+/g, '');
    
    const correct = normalizedUser === normalizedCorrect || 
                   normalizedUser.includes(normalizedCorrect) ||
                   normalizedCorrect.includes(normalizedUser);
    
    const newAttempts = attempts + 1;
    setIsCorrect(correct);
    setShowResult(true);
    setAttempts(newAttempts);
    
    if (correct) {
      reportCheckResponse(userAnswer, true, newAttempts);
      setTimeout(onComplete, 1500);
    } else if (newAttempts >= 2) {
      reportCheckResponse(userAnswer, false, newAttempts);
    }
  };

  const checkOption = (option: string) => {
    setSelectedOption(option);
    const correct = option === step.checkAnswer;
    const newAttempts = attempts + 1;
    setIsCorrect(correct);
    setShowResult(true);
    setAttempts(newAttempts);
    
    if (correct) {
      reportCheckResponse(option, true, newAttempts);
      setTimeout(onComplete, 1500);
    } else if (newAttempts >= 2) {
      reportCheckResponse(option, false, newAttempts);
    }
  };

  const skipToNext = () => {
    setShowResult(false);
    onComplete();
  };

  const renderContent = () => {
    switch (step.type) {
      case 'greeting':
      case 'explanation':
      case 'encouragement':
      case 'transition':
        return (
          <div className="space-y-4">
            <div className="text-foreground leading-relaxed">
              <MathRenderer latex={step.content} />
            </div>
            {isActive && !step.isComplete && (
              <Button 
                onClick={onComplete} 
                variant="ghost" 
                size="sm"
                className="gap-2 text-primary hover:text-primary"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        );

      case 'question':
        return (
          <div className="space-y-4">
            <div className="text-foreground leading-relaxed italic">
              <MathRenderer latex={step.content} />
            </div>
            {isActive && !step.isComplete && (
              <div className="flex gap-2">
                <Button onClick={onComplete} variant="outline" size="sm">
                  Let me think...
                </Button>
                <Button onClick={onNeedHelp} variant="ghost" size="sm" className="text-muted-foreground">
                  I need a hint
                </Button>
              </div>
            )}
          </div>
        );

      case 'formula':
        return (
          <div className="space-y-4">
            <div className="text-foreground leading-relaxed mb-3">
              <MathRenderer latex={step.content} />
            </div>
            {step.formula && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card border border-primary/30 rounded-xl p-6 text-center"
              >
                <div className="text-2xl text-foreground">
                  <MathRenderer latex={step.formula} displayMode />
                </div>
              </motion.div>
            )}
            {isActive && !step.isComplete && (
              <Button 
                onClick={onComplete} 
                variant="ghost" 
                size="sm"
                className="gap-2 text-primary hover:text-primary"
              >
                Got it! <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        );

      case 'example':
        return (
          <div className="space-y-4">
            <div className="text-foreground leading-relaxed">
              <MathRenderer latex={step.content} />
            </div>
            {isActive && !step.isComplete && (
              <Button 
                onClick={onComplete} 
                variant="ghost" 
                size="sm"
                className="gap-2 text-primary hover:text-primary"
              >
                I understand <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        );

      case 'understanding-check':
        return (
          <div className="space-y-4">
            <div className="text-foreground leading-relaxed font-medium">
              <MathRenderer latex={step.content} />
            </div>
            
            {step.checkQuestion && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="text-sm text-primary font-medium mb-3">
                  Quick check:
                </div>
                <div className="text-foreground mb-4">
                  <MathRenderer latex={step.checkQuestion} />
                </div>

                {/* Options-based answer */}
                {step.options && step.options.length > 0 ? (
                  <div className="space-y-2">
                    {step.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => !showResult && checkOption(option)}
                        disabled={showResult}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all",
                          selectedOption === option
                            ? isCorrect
                              ? "border-green-500 bg-green-500/10"
                              : "border-destructive bg-destructive/10"
                            : "border-border hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <MathRenderer latex={option} />
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Text input answer */
                  <div className="flex gap-2">
                    <Input
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="flex-1"
                      disabled={showResult && isCorrect}
                      onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                    />
                    <Button 
                      onClick={checkAnswer} 
                      disabled={!userAnswer.trim() || (showResult && isCorrect)}
                    >
                      Check
                    </Button>
                  </div>
                )}

                {/* Result feedback */}
                <AnimatePresence>
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "mt-4 p-3 rounded-lg flex items-center gap-2",
                        isCorrect ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">Excellent! That's right!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          <span>Not quite. {attempts < 2 ? "Try again!" : `The answer is ${step.checkAnswer}`}</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hint */}
                {step.checkHint && !isCorrect && (
                  <div className="mt-3">
                    {!showHint ? (
                      <button
                        onClick={() => setShowHint(true)}
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        <Lightbulb className="w-3 h-3" /> Need a hint?
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-muted-foreground italic"
                      >
                        💡 {step.checkHint}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Skip after failed attempts */}
                {showResult && !isCorrect && attempts >= 2 && (
                  <Button 
                    onClick={skipToNext} 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 gap-2"
                  >
                    Continue anyway <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        );

      case 'hint':
        return (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-foreground">
                <MathRenderer latex={step.content} />
              </div>
            </div>
            {isActive && !step.isComplete && (
              <Button 
                onClick={onComplete} 
                variant="ghost" 
                size="sm"
                className="mt-3 gap-2"
              >
                Thanks! <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: stepIndex * 0.1, duration: 0.4 }}
      className={cn(
        "flex gap-3",
        !isActive && "opacity-70"
      )}
    >
      {/* Tutor avatar */}
      <div className="flex-shrink-0">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          step.type === 'understanding-check' 
            ? "bg-primary/20" 
            : "bg-secondary"
        )}>
          <Bot className={cn(
            "w-5 h-5",
            step.type === 'understanding-check' ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
      </div>

      {/* Content bubble */}
      <div className={cn(
        "flex-1 rounded-2xl p-4",
        step.type === 'understanding-check' 
          ? "bg-card border border-primary/20" 
          : "bg-secondary/50"
      )}>
        {renderContent()}
      </div>
    </motion.div>
  );
}
