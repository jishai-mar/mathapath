import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import ConversationalStep, { ConversationalStepData, CheckResponseData, PracticePlan } from './ConversationalStep';
import TutorChat from '@/components/TutorChat';
import InteractiveMathGraph from '@/components/InteractiveMathGraph';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLearningResponseTracker } from '@/hooks/useLearningResponseTracker';
import { 
  ArrowLeft, 
  MessageCircle,
  RefreshCw
} from 'lucide-react';

interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

interface ConversationalLearnViewProps {
  subtopicName: string;
  subtopicId?: string;
  topicName?: string;
  theoryExplanation: string | null;
  workedExamples: WorkedExample[];
  onStartPractice: (plan?: PracticePlan) => void;
  onBack?: () => void;
}

export default function ConversationalLearnView({
  subtopicName,
  subtopicId,
  topicName = '',
  theoryExplanation,
  workedExamples,
  onStartPractice,
  onBack,
}: ConversationalLearnViewProps) {
  const [steps, setSteps] = useState<ConversationalStepData[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutor, setShowTutor] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graphConcept, setGraphConcept] = useState('');
  const [pastPerformance, setPastPerformance] = useState<Record<string, any> | null>(null);
  const [practicePlan, setPracticePlan] = useState<PracticePlan | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { trackResponse, fetchPastResponses, fetchLearningProfile } = useLearningResponseTracker();

  useEffect(() => {
    loadLearningContext();
  }, [subtopicName]);

  useEffect(() => {
    // Auto-scroll to latest step
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentStep]);

  const loadLearningContext = async () => {
    setIsLoading(true);
    try {
      // Fetch past performance to personalize the lesson
      const [pastResponses, profile] = await Promise.all([
        fetchPastResponses(subtopicName),
        fetchLearningProfile()
      ]);
      
      setPastPerformance(profile);
      
      // Generate conversation and practice plan in parallel
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      const [conversationResult, planResult] = await Promise.all([
        supabase.functions.invoke('generate-conversational-theory', {
          body: { 
            subtopicName, 
            topicName, 
            existingTheory: theoryExplanation, 
            existingExamples: workedExamples,
            pastResponses: pastResponses?.slice(0, 5),
            learningProfile: profile?.[subtopicName] || null,
          }
        }),
        supabase.functions.invoke('generate-practice-plan', {
          body: {
            subtopicId,
            subtopicName,
            topicName,
            userId,
          }
        })
      ]);
      
      if (conversationResult.error) throw conversationResult.error;
      
      // Store practice plan
      if (planResult.data && !planResult.error) {
        setPracticePlan(planResult.data as PracticePlan);
      }
      
      if (conversationResult.data?.steps && Array.isArray(conversationResult.data.steps)) {
        let generatedSteps = conversationResult.data.steps as ConversationalStepData[];
        
        // Add practice recommendation step if not already present
        const hasPracticeStep = generatedSteps.some(s => s.type === 'practice-recommendation');
        if (!hasPracticeStep && planResult.data) {
          generatedSteps.push({
            type: 'practice-recommendation',
            content: planResult.data.recommendation || "Now let's put what you've learned into practice!",
            practicePlan: planResult.data as PracticePlan,
          });
        }
        
        setSteps(generatedSteps);
        
        // Check if we need a graph
        if (conversationResult.data.needsGraph) {
          setShowGraph(true);
          setGraphConcept(conversationResult.data.graphConcept || subtopicName);
        }
      } else {
        setSteps(generateFallbackSteps(planResult.data as PracticePlan | undefined));
      }
    } catch (error) {
      console.error('Error generating conversation:', error);
      toast.error('Could not load the lesson. Using default content.');
      setSteps(generateFallbackSteps());
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackSteps = (plan?: PracticePlan): ConversationalStepData[] => {
    const defaultPlan: PracticePlan = plan || {
      totalExercises: 5,
      breakdown: { easy: 2, medium: 2, hard: 1 },
      estimatedMinutes: 15,
      focusAreas: ['Core concepts', 'Problem solving'],
      recommendation: "Let's practice what you've learned!",
      motivationalNote: "You've got this!",
    };
    
    return [
      {
        type: 'greeting',
        content: `Hi! Let's explore **${subtopicName}** together. I'll guide you through step by step. Ready?`
      },
      {
        type: 'question',
        content: `Before we dive in, let me ask: What do you already know about ${subtopicName.toLowerCase()}? Have you seen it before?`
      },
      {
        type: 'explanation',
        content: theoryExplanation || `${subtopicName} is a fundamental concept in mathematics. Let me break it down for you.`
      },
      {
        type: 'understanding-check',
        content: `Let's make sure you're following along.`,
        checkQuestion: `In your own words, what is the main idea of ${subtopicName.toLowerCase()}?`,
        options: [
          'I understand the concept',
          'I need more explanation',
          'Can we see an example?'
        ],
        checkAnswer: 'I understand the concept'
      },
      {
        type: 'practice-recommendation',
        content: `Great progress! You've built a solid foundation. Now let's practice to reinforce what you've learned.`,
        practicePlan: defaultPlan,
      }
    ];
  };

  const handleStepComplete = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleCheckComplete = useCallback((data: CheckResponseData) => {
    trackResponse({
      subtopicId,
      subtopicName,
      checkQuestion: data.checkQuestion,
      userAnswer: data.userAnswer,
      correctAnswer: data.correctAnswer,
      isCorrect: data.isCorrect,
      attempts: data.attempts,
      hintUsed: data.hintUsed,
      timeSpentSeconds: data.timeSpentSeconds,
    });
  }, [subtopicId, subtopicName, trackResponse]);

  const handleNeedHelp = () => {
    // Insert a hint step after current step
    const hintStep: ConversationalStepData = {
      type: 'hint',
      content: `No problem! Think about it this way: ${subtopicName.toLowerCase()} is about finding patterns and relationships. Take your time.`
    };
    
    const newSteps = [...steps];
    newSteps.splice(currentStep + 1, 0, hintStep);
    setSteps(newSteps);
    setCurrentStep(prev => prev + 1);
  };

  const isComplete = currentStep >= steps.length - 1;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-20 flex-1 rounded-2xl" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-16 flex-1 rounded-2xl" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-24 flex-1 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        )}
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTutor(!showTutor)}
            className="gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {showTutor ? 'Hide Chat' : 'Ask Question'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadLearningContext}
            title="Restart lesson"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Learning
        </span>
        <h1 className="text-2xl font-bold text-foreground mt-1">
          {subtopicName}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {currentStep + 1}/{steps.length}
          </span>
        </div>
      </motion.div>

      {/* Conversation */}
      <ScrollArea className="flex-1 -mx-6 px-6" ref={scrollRef}>
        <div className="space-y-6 pb-6">
          <AnimatePresence mode="popLayout">
            {steps.slice(0, currentStep + 1).map((step, idx) => (
              <ConversationalStep
                key={`step-${idx}`}
                step={step}
                stepIndex={idx}
                isActive={idx === currentStep}
                onComplete={handleStepComplete}
                onNeedHelp={handleNeedHelp}
                onCheckComplete={handleCheckComplete}
                onStartPractice={(plan) => onStartPractice(plan)}
              />
            ))}
          </AnimatePresence>

          {/* Interactive Graph (if needed) */}
          {showGraph && currentStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-13 pl-3"
            >
              <InteractiveMathGraph concept={graphConcept} subtopicName={subtopicName} />
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Tutor Chat Panel */}
      <AnimatePresence>
        {showTutor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 border-t border-border pt-4"
          >
            <TutorChat 
              subtopicName={subtopicName} 
              theoryContext={theoryExplanation || ''} 
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
