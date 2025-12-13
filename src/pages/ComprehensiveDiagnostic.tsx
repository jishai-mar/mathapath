import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ArrowRight, Brain, CheckCircle, Sparkles, Target, Lightbulb, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import MathRenderer from '@/components/MathRenderer';

interface DiagnosticQuestion {
  id: string;
  subtopic_id: string;
  question: string;
  correct_answer: string;
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

export default function ComprehensiveDiagnostic() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [test, setTest] = useState<DiagnosticTest | null>(null);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [phase, setPhase] = useState<'intro' | 'test' | 'analyzing' | 'results'>('intro');

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
      // Check if comprehensive diagnostic is already completed
      const { data: profileData } = await supabase
        .from('profiles')
        .select('comprehensive_diagnostic_completed')
        .eq('id', user!.id)
        .single();

      if (profileData?.comprehensive_diagnostic_completed) {
        // Already completed, redirect to dashboard
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Error checking diagnostic status:', error);
    } finally {
      setIsLoading(false);
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

        // Update test status to in_progress
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
    if (!currentAnswer.trim() || !test) return;

    setIsSubmitting(true);
    const question = questions[currentIndex];

    try {
      // Normalize answers for comparison
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/,/g, '');
      const isCorrect = normalize(currentAnswer) === normalize(question.correct_answer);

      // Save response
      await supabase.from('diagnostic_responses').insert({
        diagnostic_question_id: question.id,
        user_id: user!.id,
        user_answer: currentAnswer,
        is_correct: isCorrect,
      });

      // Update test progress
      await supabase
        .from('diagnostic_tests')
        .update({ questions_answered: currentIndex + 1 })
        .eq('id', test.id);

      // Move to next question or finish
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
    setIsAnalyzing(true);

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
        setPhase('results');
      }
    } catch (error) {
      console.error('Error analyzing results:', error);
      toast.error('Failed to analyze your results. Please try again.');
      setPhase('test');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSkip = () => {
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Intro phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl">
                Welcome to MathPath
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Let me understand how you think about math
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-muted-foreground text-center leading-relaxed">
                  Think of me as your personal math tutor. Before we start learning together, 
                  I'd like to understand where you are — not to grade you, but to help you better.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <Target className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Understanding, not testing</p>
                    <p className="text-sm text-muted-foreground">I want to see how you approach problems — there are no wrong ways to think</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">No pressure, no time limit</p>
                    <p className="text-sm text-muted-foreground">Take your time. Use hints. Skip questions you don't know yet — that's valuable information too</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <TrendingUp className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Finding your starting point</p>
                    <p className="text-sm text-muted-foreground">I'll identify what you already know and where we should focus our learning together</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Your personalized path</p>
                    <p className="text-sm text-muted-foreground">Based on your results, I'll create a learning journey designed specifically for you</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={startDiagnostic}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Preparing your assessment...
                  </>
                ) : (
                  <>
                    Let's Begin
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get encouraging message based on progress
  const getEncouragement = (index: number, total: number) => {
    const progress = index / total;
    if (index === 0) return "Let's start with something straightforward.";
    if (progress < 0.25) return "You're doing great. Keep going at your own pace.";
    if (progress < 0.5) return "Nice progress! Remember, skipping is perfectly fine.";
    if (progress < 0.75) return "More than halfway there. Take your time.";
    if (progress < 0.9) return "Almost done! You're doing wonderfully.";
    return "Just a few more to go. You've got this.";
  };

  // Test phase
  if (phase === 'test' && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-primary">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2 text-center italic">
              {getEncouragement(currentIndex, questions.length)}
            </p>
          </div>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg leading-relaxed">
                <MathRenderer latex={currentQuestion.question} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Your answer..."
                onKeyDown={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                disabled={isSubmitting}
                className="text-lg"
                autoFocus
              />

              {/* Hint section */}
              {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <div>
                  {!showHint ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHint(true)}
                      className="text-muted-foreground"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Need a hint? (No penalty)
                    </Button>
                  ) : (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-primary">
                        <Lightbulb className="w-4 h-4 inline mr-2" />
                        {currentQuestion.hints[0]}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  I don't know yet
                </Button>
                <Button
                  onClick={handleAnswerSubmit}
                  disabled={isSubmitting || !currentAnswer.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Analyzing phase
  if (phase === 'analyzing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="border-border/50 bg-card/50 max-w-md w-full text-center">
          <CardContent className="py-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold">Understanding Your Math Profile</h2>
            <p className="text-muted-foreground">
              I'm reviewing your responses to understand your strengths, 
              identify areas where we can grow together, and create your personalized learning path...
            </p>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results phase
  if (phase === 'results' && profile) {
    const topicLevels = Object.entries(profile.topic_levels || {});
    const strongTopics = topicLevels.filter(([, t]) => t.status === 'strong');
    const needsAttention = topicLevels.filter(([, t]) => t.status === 'needs_attention');

    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Your Learning Profile</CardTitle>
              <CardDescription className="text-base">
                {profile.overall_assessment}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall level */}
              <div className="text-center p-6 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground mb-2">Your Overall Level</p>
                <p className="text-5xl font-bold text-primary">{profile.overall_level}%</p>
              </div>

              {/* Topic overview */}
              {topicLevels.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    Topics Overview
                  </h3>
                  <div className="grid gap-2">
                    {topicLevels
                      .sort(([, a], [, b]) => b.level - a.level)
                      .map(([topicId, topic]) => (
                        <div 
                          key={topicId} 
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                        >
                          <span className="text-sm font-medium">{topic.topic_name}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  topic.status === 'strong' 
                                    ? 'bg-green-500' 
                                    : topic.status === 'developing' 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${topic.level}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-10 text-right">
                              {topic.level}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {strongTopics.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    Your Strengths
                  </h3>
                  <div className="space-y-2">
                    {profile.strengths?.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="font-medium text-green-400 text-sm">{s.topic_name}</p>
                        <p className="text-sm text-muted-foreground">{s.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas to focus */}
              {needsAttention.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    Areas to Focus On
                  </h3>
                  <div className="space-y-2">
                    {profile.weaknesses?.map((w, i) => (
                      <div key={i} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <p className="font-medium text-yellow-400 text-sm">{w.topic_name}</p>
                        <p className="text-sm text-muted-foreground">{w.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning path suggestion */}
              {profile.learning_path_suggestion && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Recommended Learning Path
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.learning_path_suggestion}
                  </p>
                  {profile.recommended_starting_topic_name && (
                    <p className="text-sm mt-2">
                      <span className="text-primary font-medium">Start with:</span>{' '}
                      {profile.recommended_starting_topic_name}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={goToDashboard}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={goToRecommendedTopic}
                  className="flex-1"
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
