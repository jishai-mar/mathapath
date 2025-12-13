import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  Brain, 
  CheckCircle, 
  Sparkles, 
  Target, 
  Lightbulb, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  GraduationCap,
  Briefcase,
  Compass,
  Dumbbell,
  Building2,
  Eye,
  FileCheck,
  ChevronLeft,
  Keyboard
} from 'lucide-react';
import { toast } from 'sonner';
import MathRenderer from '@/components/MathRenderer';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import SelectionCard from '@/components/onboarding/SelectionCard';
import QuestionHeader from '@/components/onboarding/QuestionHeader';
import OnboardingComplete from '@/components/onboarding/OnboardingComplete';

interface DiagnosticQuestion {
  id: string;
  subtopic_id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];
  order_index: number;
}

interface DiagnosticTest {
  id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  total_questions: number;
  questions_answered: number;
}

interface TopicLevel {
  topic_name: string;
  level: number;
  status: 'strong' | 'developing' | 'needs_attention';
}

interface LearningProfile {
  overall_assessment: string;
  overall_level: number;
  topic_levels: Record<string, TopicLevel>;
  strengths: Array<{ topic_id: string; topic_name: string; reason: string }>;
  weaknesses: Array<{ topic_id: string; topic_name: string; reason: string }>;
  misconception_patterns: Array<{ pattern: string; how_to_address: string }>;
  recommended_starting_topic_id: string;
  recommended_starting_topic_name: string;
  learning_path_suggestion: string;
  learning_style_notes: string;
}

type OnboardingPhase = 
  | 'loading' 
  | 'motivation' 
  | 'goal' 
  | 'intro' 
  | 'test' 
  | 'analyzing' 
  | 'complete';

const MOTIVATION_OPTIONS = [
  { id: 'school', icon: GraduationCap, title: 'School Prep', subtitle: 'Preparing for exams and coursework' },
  { id: 'career', icon: Briefcase, title: 'Career Growth', subtitle: 'Building skills for professional advancement' },
  { id: 'curiosity', icon: Compass, title: 'Pure Curiosity', subtitle: 'Learning for the joy of understanding' },
  { id: 'brain', icon: Dumbbell, title: 'Brain Training', subtitle: 'Keeping my mind sharp and active' },
];

const GOAL_OPTIONS = [
  { id: 'basics', icon: Building2, title: 'Master the basics', subtitle: 'Build a strong foundation in core concepts' },
  { id: 'visualize', icon: Eye, title: 'Visualize concepts', subtitle: 'Understand through visual representations' },
  { id: 'exams', icon: FileCheck, title: 'Prepare for exams', subtitle: 'Focus on test-taking and problem solving' },
];

export default function ComprehensiveDiagnostic() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<OnboardingPhase>('loading');
  const [selectedMotivation, setSelectedMotivation] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  
  // Diagnostic state
  const [isGenerating, setIsGenerating] = useState(false);
  const [test, setTest] = useState<DiagnosticTest | null>(null);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<LearningProfile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkDiagnosticStatus();
    }
  }, [user]);

  const checkDiagnosticStatus = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('comprehensive_diagnostic_completed')
        .eq('id', user!.id)
        .single();

      if (profileData?.comprehensive_diagnostic_completed) {
        navigate('/');
        return;
      }
      
      setPhase('motivation');
    } catch (error) {
      console.error('Error checking diagnostic status:', error);
      setPhase('motivation');
    }
  };

  const handleMotivationNext = () => {
    if (selectedMotivation) {
      setPhase('goal');
    }
  };

  const handleGoalNext = () => {
    if (selectedGoal) {
      setPhase('intro');
    }
  };

  const startDiagnostic = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-comprehensive-diagnostic', {
        body: { userId: user!.id },
      });

      if (error) throw error;

      if (data?.alreadyCompleted) {
        navigate('/');
        return;
      }

      if (data?.test && data?.questions) {
        setTest(data.test);
        setQuestions(data.questions);
        setPhase('test');

        await supabase
          .from('diagnostic_tests')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', data.test.id);
      }
    } catch (error) {
      console.error('Error starting diagnostic:', error);
      toast.error('Failed to generate diagnostic test. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!test) return;

    setIsSubmitting(true);
    const question = questions[currentIndex];

    try {
      const { data, error } = await supabase.functions.invoke('check-diagnostic-answer', {
        body: {
          questionId: question.id,
          userAnswer: currentAnswer.trim() || null,
          userId: user!.id,
        },
      });

      if (error) throw error;

      await supabase
        .from('diagnostic_tests')
        .update({ questions_answered: currentIndex + 1 })
        .eq('id', test.id);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setCurrentAnswer('');
        setShowHint(false);
      } else {
        await analyzeResults();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to save your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const analyzeResults = async () => {
    setPhase('analyzing');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-comprehensive-diagnostic', {
        body: {
          diagnosticTestId: test!.id,
          userId: user!.id,
        },
      });

      if (error) throw error;

      if (data?.profile) {
        setProfile(data.profile);
        setPhase('complete');
      }
    } catch (error) {
      console.error('Error analyzing results:', error);
      toast.error('Failed to analyze your results. Please try again.');
      setPhase('test');
    }
  };

  const handleSkip = async () => {
    const question = questions[currentIndex];
    
    try {
      await supabase.functions.invoke('check-diagnostic-answer', {
        body: {
          questionId: question.id,
          userAnswer: null,
          userId: user!.id,
        },
      });
    } catch (error) {
      console.error('Error recording skip:', error);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentAnswer('');
      setShowHint(false);
    } else {
      analyzeResults();
    }
  };

  const goToDashboard = () => {
    navigate('/');
  };

  const goToRecommendedTopic = () => {
    if (profile?.recommended_starting_topic_id) {
      navigate(`/practice/${profile.recommended_starting_topic_id}`);
    } else {
      navigate('/');
    }
  };

  // Calculate current step for progress
  const getCurrentStep = () => {
    switch (phase) {
      case 'motivation': return 1;
      case 'goal': return 2;
      case 'intro': return 3;
      case 'test': return 4;
      case 'analyzing': return 5;
      case 'complete': return 5;
      default: return 1;
    }
  };

  // Loading state
  if (authLoading || phase === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="space-y-6 w-full max-w-md">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Phase: Motivation
  if (phase === 'motivation') {
    return (
      <OnboardingLayout
        currentStep={1}
        totalSteps={5}
        showBack={false}
      >
        <QuestionHeader
          tag="Goal Setting"
          question="What is your primary motivation for learning mathematics?"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {MOTIVATION_OPTIONS.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SelectionCard
                icon={option.icon}
                title={option.title}
                subtitle={option.subtitle}
                isSelected={selectedMotivation === option.id}
                onClick={() => setSelectedMotivation(option.id)}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <Button
            onClick={handleMotivationNext}
            disabled={!selectedMotivation}
            size="lg"
            className="px-12 py-6 text-lg font-semibold shadow-primary-glow hover:shadow-primary-glow-lg transition-shadow"
          >
            Next Question
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Press Enter ↵ to continue</span>
          </div>
        </motion.div>
      </OnboardingLayout>
    );
  }

  // Phase: Goal
  if (phase === 'goal') {
    return (
      <OnboardingLayout
        currentStep={2}
        totalSteps={5}
        onBack={() => setPhase('motivation')}
      >
        <QuestionHeader
          tag="Learning Style"
          question="What's your primary goal with MathPath?"
        />

        <div className="space-y-4 mb-8">
          {GOAL_OPTIONS.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SelectionCard
                icon={option.icon}
                title={option.title}
                subtitle={option.subtitle}
                isSelected={selectedGoal === option.id}
                onClick={() => setSelectedGoal(option.id)}
                variant="large"
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <Button
            onClick={handleGoalNext}
            disabled={!selectedGoal}
            size="lg"
            className="px-12 py-6 text-lg font-semibold shadow-primary-glow hover:shadow-primary-glow-lg transition-shadow"
          >
            Next Question
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Press Enter ↵ to continue</span>
          </div>
        </motion.div>
      </OnboardingLayout>
    );
  }

  // Phase: Intro
  if (phase === 'intro') {
    return (
      <OnboardingLayout
        currentStep={3}
        totalSteps={5}
        onBack={() => setPhase('goal')}
      >
        <div className="text-center space-y-8">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mx-auto"
          >
            <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto border border-primary/30">
              <Brain className="w-12 h-12 text-primary" />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Let me understand how you think
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Think of me as your personal math tutor. Before we start learning together, 
              I'd like to understand where you are — not to grade you, but to help you better.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid gap-3 text-left max-w-md mx-auto"
          >
            {[
              { icon: Target, title: 'Understanding, not testing', desc: 'I want to see how you approach problems' },
              { icon: Lightbulb, title: 'No pressure, no time limit', desc: 'Take your time. Use hints. Skip if needed' },
              { icon: TrendingUp, title: 'Finding your starting point', desc: 'I\'ll identify where we should focus' },
              { icon: Sparkles, title: 'Your personalized path', desc: 'A learning journey designed for you' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-card/50 border border-border/30"
              >
                <item.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              onClick={startDiagnostic}
              disabled={isGenerating}
              size="lg"
              className="px-12 py-6 text-lg font-semibold shadow-primary-glow hover:shadow-primary-glow-lg transition-shadow"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Preparing assessment...
                </>
              ) : (
                <>
                  Let's Begin
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </OnboardingLayout>
    );
  }

  // Phase: Test
  if (phase === 'test' && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    const getEncouragement = (index: number, total: number) => {
      const progress = index / total;
      if (index === 0) return "Let's start with something straightforward.";
      if (progress < 0.25) return "You're doing great. Keep going at your own pace.";
      if (progress < 0.5) return "Nice progress! Remember, skipping is perfectly fine.";
      if (progress < 0.75) return "More than halfway there. Take your time.";
      if (progress < 0.9) return "Almost done! You're doing wonderfully.";
      return "Just a few more to go. You've got this.";
    };

    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsla(145, 76%, 30%, 0.1) 0%, transparent 50%)',
          }}
        />

        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-border/20 z-50">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPhase('intro')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </header>

          {/* Main content */}
          <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
            <div className="w-full max-w-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Encouragement */}
                  <p className="text-sm text-muted-foreground text-center italic">
                    {getEncouragement(currentIndex, questions.length)}
                  </p>

                  {/* Question card */}
                  <div className="p-6 rounded-2xl bg-card/50 border border-border/30 backdrop-blur-sm">
                    <div className="text-lg leading-relaxed text-foreground mb-6">
                      <MathRenderer latex={currentQuestion.question} />
                    </div>

                    <Input
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Your answer..."
                      onKeyDown={(e) => e.key === 'Enter' && currentAnswer.trim() && handleAnswerSubmit()}
                      disabled={isSubmitting}
                      className="text-lg h-14 bg-background/50 border-border/50 focus:border-primary/50"
                      autoFocus
                    />

                    {/* Hint */}
                    {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                      <div className="mt-4">
                        {!showHint ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHint(true)}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Need a hint? (No penalty)
                          </Button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-xl bg-primary/10 border border-primary/20"
                          >
                            <p className="text-sm text-primary flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                              {currentQuestion.hints[0]}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      disabled={isSubmitting}
                      className="flex-1 h-12 border-border/50 hover:border-primary/30"
                    >
                      I don't know yet
                    </Button>
                    <Button
                      onClick={handleAnswerSubmit}
                      disabled={isSubmitting || !currentAnswer.trim()}
                      className="flex-1 h-12 shadow-primary-glow"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : currentIndex === questions.length - 1 ? (
                        'Finish'
                      ) : (
                        <>
                          Submit
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Don't worry about getting it right — I'm learning how you think
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Phase: Analyzing
  if (phase === 'analyzing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
              <Brain className="w-12 h-12 text-primary animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Understanding Your Math Profile</h2>
            <p className="text-muted-foreground text-sm">
              I'm reviewing your responses to understand your strengths and create your personalized learning path...
            </p>
          </div>
          
          <div className="w-full max-w-xs mx-auto h-2 bg-border/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Phase: Complete
  if (phase === 'complete' && profile) {
    const topicLevels = Object.entries(profile.topic_levels || {});
    const strongTopics = topicLevels.filter(([, t]) => t.status === 'strong');
    const needsAttention = topicLevels.filter(([, t]) => t.status === 'needs_attention');

    return (
      <OnboardingLayout
        currentStep={5}
        totalSteps={5}
        showBack={false}
      >
        <OnboardingComplete
          title="Foundation Set"
          subtitle="Your learning path has been calibrated based on your unique mathematical profile. I've identified exactly where to begin your journey."
          onContinue={goToRecommendedTopic}
        />

        {/* Profile summary - shown below the complete component */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 space-y-6"
        >
          {/* Overall level */}
          <div className="p-6 rounded-2xl bg-card/50 border border-border/30 text-center">
            <p className="text-sm text-muted-foreground mb-2">Your Overall Level</p>
            <p className="text-5xl font-bold text-primary">{profile.overall_level}%</p>
            <p className="text-sm text-muted-foreground mt-2">{profile.overall_assessment}</p>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid sm:grid-cols-2 gap-4">
            {strongTopics.length > 0 && (
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <h3 className="font-semibold flex items-center gap-2 text-green-400 mb-3">
                  <Sparkles className="w-4 h-4" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {profile.strengths?.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      <span className="text-green-400 font-medium">{s.topic_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {needsAttention.length > 0 && (
              <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <h3 className="font-semibold flex items-center gap-2 text-yellow-400 mb-3">
                  <AlertCircle className="w-4 h-4" />
                  Focus Areas
                </h3>
                <ul className="space-y-2">
                  {profile.weaknesses?.slice(0, 3).map((w, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      <span className="text-yellow-400 font-medium">{w.topic_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommended path */}
          {profile.recommended_starting_topic_name && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-primary">Recommended Starting Point</span>
              </div>
              <p className="text-foreground font-medium">{profile.recommended_starting_topic_name}</p>
              {profile.learning_path_suggestion && (
                <p className="text-sm text-muted-foreground mt-2">{profile.learning_path_suggestion}</p>
              )}
            </div>
          )}

          {/* Alternative action */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={goToDashboard}
              className="text-muted-foreground hover:text-foreground"
            >
              Go to Dashboard Instead
            </Button>
          </div>
        </motion.div>
      </OnboardingLayout>
    );
  }

  return null;
}
