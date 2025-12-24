import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Brain, CheckCircle, Sparkles, Target, Lightbulb, AlertCircle, ThumbsUp, PlayCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import MathRenderer from '@/components/MathRenderer';
import TutorCharacter from '@/components/tutor/TutorCharacter';
import { SolutionWalkthrough } from '@/components/exercise/SolutionWalkthrough';

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

interface LearningProfile {
  overall_assessment: string;
  overall_level: number;
  strengths: Array<{ subtopic_id: string; subtopic_name: string; reason: string }>;
  weaknesses: Array<{ subtopic_id: string; subtopic_name: string; reason: string }>;
  misconception_patterns: Array<{ pattern: string; how_to_address: string }>;
  learning_style_notes: string;
}

interface TutorFeedback {
  what_went_well: string;
  where_it_breaks: string;
  what_to_focus_on_next: string;
}

export default function DiagnosticTest() {
  const { topicId } = useParams<{ topicId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [topicName, setTopicName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [test, setTest] = useState<DiagnosticTest | null>(null);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [phase, setPhase] = useState<'intro' | 'test' | 'analyzing' | 'results'>('intro');
  
  // Feedback state
  const [currentFeedback, setCurrentFeedback] = useState<TutorFeedback | null>(null);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [showSolutionWalkthrough, setShowSolutionWalkthrough] = useState(false);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && topicId) {
      loadTopicAndCheckStatus();
    }
  }, [user, topicId]);

  const loadTopicAndCheckStatus = async () => {
    try {
      // Get topic name
      const { data: topic } = await supabase
        .from('topics')
        .select('name')
        .eq('id', topicId)
        .single();

      if (topic) {
        setTopicName(topic.name);
      }

      // Check for existing diagnostic test
      const { data: existingTest } = await supabase
        .from('diagnostic_tests')
        .select('*')
        .eq('user_id', user!.id)
        .eq('topic_id', topicId)
        .single();

      if (existingTest?.status === 'completed') {
        // Load learning profile and show results
        const { data: profileData } = await supabase
          .from('learning_profiles')
          .select('*')
          .eq('user_id', user!.id)
          .eq('topic_id', topicId)
          .single();

        if (profileData) {
          setProfile({
            overall_assessment: 'Your personalized learning profile is ready.',
            overall_level: profileData.overall_level,
            strengths: profileData.strengths as any || [],
            weaknesses: profileData.weaknesses as any || [],
            misconception_patterns: profileData.misconception_patterns as any || [],
            learning_style_notes: profileData.learning_style_notes || '',
          });
          setPhase('results');
        }
      }
    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startDiagnostic = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-diagnostic', {
        body: { topicId, userId: user!.id },
      });

      if (error) throw error;

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
      // Call edge function to check answer (secure, server-side validation)
      const { data, error } = await supabase.functions.invoke('check-diagnostic-answer', {
        body: {
          questionId: question.id,
          userAnswer: currentAnswer,
          userId: user!.id,
        },
      });

      if (error) throw error;

      const isCorrect = data.isCorrect;
      setLastAnswerCorrect(isCorrect);
      
      // Store correct answer for solution walkthrough
      if (data.correctAnswer) {
        setCurrentCorrectAnswer(data.correctAnswer);
      }
      setAnswers(prev => new Map(prev).set(question.id, currentAnswer));

      // Update test progress
      await supabase
        .from('diagnostic_tests')
        .update({ questions_answered: currentIndex + 1 })
        .eq('id', test.id);

      if (isCorrect) {
        // Correct answer - show brief celebration, then move on
        setShowingFeedback(true);
        setCurrentFeedback(null);
        
        // Auto-advance after a short delay for correct answers
        setTimeout(() => {
          proceedToNextQuestion();
        }, 1500);
      } else {
        // Incorrect - show tutor feedback
        setCurrentFeedback(data.feedback);
        setShowingFeedback(true);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to save your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const proceedToNextQuestion = () => {
    setShowingFeedback(false);
    setCurrentFeedback(null);
    setLastAnswerCorrect(null);
    setShowSolutionWalkthrough(false);
    setCurrentCorrectAnswer(undefined);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentAnswer('');
      setShowHint(false);
    } else {
      // All questions answered, analyze results
      analyzeResults();
    }
  };

  const analyzeResults = async () => {
    setPhase('analyzing');
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-diagnostic', {
        body: {
          diagnosticTestId: test!.id,
          userId: user!.id,
          topicId,
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
      const nextQuestion = questions[currentIndex + 1];
      setCurrentAnswer(answers.get(nextQuestion.id) || '');
      setShowHint(false);
    } else {
      analyzeResults();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      const previousQuestion = questions[previousIndex];
      setCurrentAnswer(answers.get(previousQuestion.id) || '');
      setCurrentIndex(previousIndex);
      setShowHint(false);
    }
  };

  const goToPractice = () => {
    navigate(`/practice/${topicId}`);
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
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                Let's See Where You Are
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {topicName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-center">
                Before we start learning, let's take a quick assessment to understand your current level.
                This isn't a test or exam — it's just a way for us to personalize your learning experience.
              </p>

              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Target className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Find your starting point</p>
                    <p className="text-sm text-muted-foreground">We'll identify what you already know and what needs work</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Personalized learning path</p>
                    <p className="text-sm text-muted-foreground">Get exercises tailored to your level and needs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">No pressure</p>
                    <p className="text-sm text-muted-foreground">Take your time, use hints if needed, skip if unsure</p>
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
                    Start Assessment
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
          </div>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className={`px-2 py-0.5 rounded-full ${
                  currentQuestion.difficulty === 'easy' 
                    ? 'bg-green-500/20 text-green-400' 
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              <CardTitle className="text-lg leading-relaxed">
                <MathRenderer latex={currentQuestion.question} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show feedback after answering */}
              {showingFeedback ? (
                <div className="space-y-4">
                  {/* Tutor character */}
                  <div className="flex justify-center">
                    <TutorCharacter 
                      mood={lastAnswerCorrect ? 'celebrating' : 'explaining'} 
                      size="md"
                      showSpeechBubble={lastAnswerCorrect}
                    />
                  </div>

                  {lastAnswerCorrect ? (
                    // Correct answer feedback
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-green-400">Correct!</p>
                      <p className="text-sm text-muted-foreground mt-1">Moving to the next question...</p>
                    </div>
                  ) : currentFeedback ? (
                    // Incorrect answer feedback with tutor explanation
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-amber-400 mb-1">Not quite right</p>
                            <p className="text-sm text-muted-foreground">Let's understand what happened...</p>
                          </div>
                        </div>
                      </div>

                      {/* What went well */}
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-start gap-2">
                          <ThumbsUp className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-green-400 mb-1">What went well</p>
                            <p className="text-sm">{currentFeedback.what_went_well}</p>
                          </div>
                        </div>
                      </div>

                      {/* Where it breaks */}
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-primary mb-1">Where to look again</p>
                            <p className="text-sm">{currentFeedback.where_it_breaks}</p>
                          </div>
                        </div>
                      </div>

                      {/* What to focus on */}
                      <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Remember for next time</p>
                            <p className="text-sm">{currentFeedback.what_to_focus_on_next}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          variant="secondary" 
                          onClick={() => setShowSolutionWalkthrough(true)} 
                          className="flex-1 gap-2"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Toon Uitwerking
                        </Button>
                        <Button onClick={proceedToNextQuestion} className="flex-1" size="lg">
                          Ik snap het, verder
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                // Normal question answering UI
                <>
                  <Input
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Your answer..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                    disabled={isSubmitting}
                    className="text-lg"
                  />

                  {/* Hint and Solution section */}
                  <div className="flex flex-wrap items-center gap-2">
                    {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                      <>
                        {!showHint ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHint(true)}
                            className="text-muted-foreground"
                          >
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Need a hint?
                          </Button>
                        ) : (
                          <div className="w-full p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-sm text-primary">
                              <Lightbulb className="w-4 h-4 inline mr-2" />
                              {currentQuestion.hints[0]}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Show Solution Button - Always visible */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSolutionWalkthrough(true)}
                      className="text-muted-foreground gap-2 hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Toon uitwerking
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={isSubmitting || currentIndex === 0}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Skip
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
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Solution Walkthrough Modal */}
          <SolutionWalkthrough
            isOpen={showSolutionWalkthrough}
            onClose={() => setShowSolutionWalkthrough(false)}
            question={currentQuestion.question}
            subtopicName={topicName}
            correctAnswer={currentCorrectAnswer}
          />
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
            <h2 className="text-xl font-semibold">Analyzing Your Results</h2>
            <p className="text-muted-foreground">
              We're creating your personalized learning profile...
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
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Your Learning Profile</CardTitle>
              <CardDescription className="text-base">{topicName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall level */}
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground mb-2">Your Starting Level</p>
                <p className="text-4xl font-bold text-primary">{profile.overall_level}%</p>
              </div>

              {/* Strengths */}
              {profile.strengths.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    Your Strengths
                  </h3>
                  <div className="space-y-2">
                    {profile.strengths.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="font-medium text-sm">{s.subtopic_name}</p>
                        <p className="text-sm text-muted-foreground">{s.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {profile.weaknesses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-[hsl(var(--warning))]" />
                    Focus Areas
                  </h3>
                  <div className="space-y-2">
                    {profile.weaknesses.map((w, i) => (
                      <div key={i} className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                        <p className="font-medium text-sm">{w.subtopic_name}</p>
                        <p className="text-sm text-muted-foreground">{w.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning style notes */}
              {profile.learning_style_notes && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm">
                    <Lightbulb className="w-4 h-4 inline mr-2 text-primary" />
                    {profile.learning_style_notes}
                  </p>
                </div>
              )}

              <Button onClick={goToPractice} className="w-full" size="lg">
                Start Learning
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
