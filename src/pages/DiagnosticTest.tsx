import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { MathKeyboard } from '@/components/math/MathKeyboard';
import { HandwritingCanvas } from '@/components/math/HandwritingCanvas';
import { ArrowLeft, ArrowRight, Brain, CheckCircle, Sparkles, Target, Lightbulb, AlertCircle, ThumbsUp, PlayCircle, BookOpen, Eye, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import MathRenderer from '@/components/MathRenderer';
import TutorCharacter from '@/components/tutor/TutorCharacter';
import { SolutionWalkthrough } from '@/components/exercise/SolutionWalkthrough';
import type { ContentSegment } from '@/lib/normalizeLatex';

// Khan Academy–style: caller explicitly types text vs math
const LATEX_TRIGGER = /\\left|\\begin\{|\\frac|\\sqrt|\\\(|\\\[|\\pm|\\times|\\\\|\$/;

function sanitizeMath(math: string): string {
  let result = math;
  result = result.replace(/\\left\{/g, '\\left\\{');
  result = result.replace(/\\right(?![.\)\]\}])/g, '\\right.');
  return result;
}

function createSegmentsFromQuestion(question: string): ContentSegment[] {
  const q = question.trim();
  
  // FIRST: Check for inline $...$ math chunks
  const inlineMathRegex = /\$([^$]+)\$/g;
  const mathChunks: string[] = [];
  let match;
  
  while ((match = inlineMathRegex.exec(q)) !== null) {
    mathChunks.push(match[1].trim());
  }
  
  if (mathChunks.length > 0) {
    // Extract text part (everything before the first $)
    const firstDollarIdx = q.indexOf('$');
    const textPart = firstDollarIdx > 0 ? q.slice(0, firstDollarIdx).trim() : '';
    
    if (mathChunks.length >= 2) {
      // SYSTEM OF EQUATIONS: combine into stacked aligned block
      const alignedEquations = mathChunks.map(eq => {
        // Replace first = with &= for alignment
        return eq.replace(/=/, ' &= ');
      }).join(' \\\\ ');
      
      const systemLatex = sanitizeMath(`\\left\\{\\begin{aligned} ${alignedEquations} \\end{aligned}\\right.`);
      
      const result: ContentSegment[] = [];
      if (textPart) {
        result.push({ type: 'text' as const, content: textPart });
      }
      result.push({ type: 'math' as const, content: systemLatex, displayMode: true });
      return result;
    } else {
      // SINGLE MATH CHUNK: render as inline math unless it contains \begin or \left
      const mathContent = sanitizeMath(mathChunks[0]);
      const isDisplayMode = /\\begin\{|\\left/.test(mathContent);
      
      const result: ContentSegment[] = [];
      if (textPart) {
        result.push({ type: 'text' as const, content: textPart });
      }
      result.push({ type: 'math' as const, content: mathContent, displayMode: isDisplayMode });
      return result;
    }
  }
  
  // FALLBACK: Raw LaTeX trigger logic (existing behavior)
  const idx = q.search(LATEX_TRIGGER);

  if (idx === -1) {
    return [{ type: 'text' as const, content: q }];
  }

  let textPart = '';
  let mathPart = '';

  if (idx === 0) {
    mathPart = q;
  } else {
    textPart = q.slice(0, idx).trim();
    mathPart = q.slice(idx).trim();
  }

  mathPart = sanitizeMath(mathPart);
  const isDisplayMode = /\\begin\{|\\left/.test(mathPart);

  const result: ContentSegment[] = [];
  if (textPart) {
    result.push({ type: 'text' as const, content: textPart });
  }
  result.push({ type: 'math' as const, content: mathPart, displayMode: isDisplayMode });
  return result;
}


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

// Helper function to detect answer format from question text
const getAnswerFormatHint = (question: string): string | null => {
  const q = question.toLowerCase();
  
  // Quadratic/polynomial equations with multiple solutions
  if (q.includes('x²') || q.includes('x^2') || q.includes('kwadratisch') || q.includes('quadratic')) {
    return 'Meerdere oplossingen? Schrijf: x = 2 of x = -3';
  }
  
  // Equations asking for x
  if ((q.includes('los op') || q.includes('solve')) && (q.includes('x =') || q.includes('x='))) {
    return 'Schrijf je antwoord als: x = ...';
  }
  
  // Fraction answers
  if (q.includes('breuk') || q.includes('fraction') || q.includes('vereenvoudig')) {
    return 'Schrijf breuken als: 3/4 of als decimaal: 0.75';
  }
  
  // Coordinate answers
  if (q.includes('coördinat') || q.includes('coordinate') || q.includes('punt')) {
    return 'Schrijf coördinaten als: (2, 3)';
  }
  
  // Algebraic expressions
  if (q.includes('vereenvoudig') || q.includes('simplify')) {
    return 'Gebruik x voor de variabele, bijv: 2x + 3';
  }
  
  // Percentage
  if (q.includes('procent') || q.includes('percentage') || q.includes('%')) {
    return 'Schrijf percentages als getal: 25 (zonder %)';
  }
  
  return null;
};

// Helper function to get appropriate placeholder based on question
const getInputPlaceholder = (question: string): string => {
  const q = question.toLowerCase();
  
  if (q.includes('x²') || q.includes('x^2')) {
    return 'bijv. x = 2 of x = -3';
  }
  if (q.includes('los op') || q.includes('solve')) {
    return 'bijv. x = 5';
  }
  if (q.includes('breuk') || q.includes('fraction')) {
    return 'bijv. 3/4 of 0.75';
  }
  if (q.includes('coördinat') || q.includes('punt')) {
    return 'bijv. (2, 3)';
  }
  
  return 'Jouw antwoord...';
};

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
  const [showQuickAnswer, setShowQuickAnswer] = useState(false);
  const [showTheoryRefresh, setShowTheoryRefresh] = useState(false);
  const [theoryContent, setTheoryContent] = useState<string | null>(null);
  const [isLoadingTheory, setIsLoadingTheory] = useState(false);
  
  // Track shown questions in session to avoid repeats, and weak subtopics
  const [shownQuestionIds, setShownQuestionIds] = useState<Set<string>>(new Set());
  const [weakSubtopics, setWeakSubtopics] = useState<Set<string>>(new Set());

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
      } else if (existingTest?.status === 'in_progress') {
        // Resume in-progress test - load existing questions
        const { data: existingQuestions } = await supabase.functions.invoke('generate-diagnostic', {
          body: { topicId, userId: user!.id },
        });

        if (existingQuestions?.questions && existingQuestions.questions.length > 0) {
          const totalQuestions = existingQuestions.questions.length;
          const answeredCount = existingTest.questions_answered || 0;
          
          // If all questions answered, trigger analysis instead of showing test
          if (answeredCount >= totalQuestions) {
            setTest(existingQuestions.test);
            setQuestions(existingQuestions.questions);
            // Trigger analysis
            setPhase('analyzing');
            analyzeResultsAfterResume(existingQuestions.test.id, existingQuestions.questions);
          } else {
            setTest(existingQuestions.test);
            setQuestions(existingQuestions.questions);
            setCurrentIndex(answeredCount);
            
            // Load existing responses to pre-fill answers
            const { data: existingResponses } = await supabase
              .from('diagnostic_responses')
              .select('diagnostic_question_id, user_answer')
              .eq('user_id', user!.id);
            
            if (existingResponses) {
              const answersMap = new Map<string, string>();
              existingResponses.forEach(r => {
                if (r.user_answer) {
                  answersMap.set(r.diagnostic_question_id, r.user_answer);
                }
              });
              setAnswers(answersMap);
            }
            
            setPhase('test');
          }
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
    
    // Track this question as shown in session
    setShownQuestionIds(prev => new Set(prev).add(question.id));

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
        // Incorrect - record this subtopic as needing more work
        setWeakSubtopics(prev => new Set(prev).add(question.subtopic_id));
        
        // Show tutor feedback
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
    setShowQuickAnswer(false);
    
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

  // Helper for analyzing when resuming a completed test
  const analyzeResultsAfterResume = async (testId: string, resumedQuestions: DiagnosticQuestion[]) => {
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-diagnostic', {
        body: {
          diagnosticTestId: testId,
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
      // Fall back to intro phase since we can't resume test
      setPhase('intro');
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
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

  const loadTheoryRefresh = async () => {
    if (!questions[currentIndex]) return;
    
    setIsLoadingTheory(true);
    setShowTheoryRefresh(true);
    
    try {
      // Use the solve-exercise function to get theory for this question type
      const { data, error } = await supabase.functions.invoke('solve-exercise', {
        body: {
          question: questions[currentIndex].question,
          subtopicName: topicName,
          correctAnswer: questions[currentIndex].correct_answer,
        },
      });

      if (error) throw error;
      
      // Combine theory review and common mistakes into a comprehensive theory section
      let theoryText = '';
      
      if (data?.theoryReview) {
        theoryText = data.theoryReview;
      }
      
      if (data?.commonMistakes && data.commonMistakes.length > 0) {
        theoryText += '\n\n**Let op deze veelgemaakte fouten:**\n';
        data.commonMistakes.forEach((mistake: string, index: number) => {
          theoryText += `${index + 1}. ${mistake}\n`;
        });
      }
      
      setTheoryContent(theoryText || 'Theorie wordt geladen...');
    } catch (error) {
      console.error('Error loading theory:', error);
      setTheoryContent('Kon theorie niet laden. Probeer het opnieuw.');
    } finally {
      setIsLoadingTheory(false);
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
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Generating personalized questions...
                    </div>
                    <span className="text-xs opacity-70">This may take 15-30 seconds</span>
                  </div>
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
    
    // Guard against undefined currentQuestion (can happen if currentIndex is out of bounds)
    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-background p-4 sm:p-6">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground">Loading question...</p>
          </div>
        </div>
      );
    }
    
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
              <CardTitle className="text-lg leading-relaxed font-math">
                <MathRenderer segments={createSegmentsFromQuestion(currentQuestion.question)} />
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
                  {/* Answer format hint */}
                  {getAnswerFormatHint(currentQuestion.question) && (
                    <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg flex items-center gap-2">
                      <span className="text-primary">💡</span>
                      <span>{getAnswerFormatHint(currentQuestion.question)}</span>
                    </div>
                  )}
                  
                  {/* Math Keyboard */}
                  <MathKeyboard 
                    onInsert={(symbol) => setCurrentAnswer(prev => prev + symbol)}
                    currentQuestion={currentQuestion?.question}
                  />
                  
                  {/* Multi-line Answer Input */}
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder={getInputPlaceholder(currentQuestion.question)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        handleAnswerSubmit();
                      }
                    }}
                    disabled={isSubmitting}
                    className="text-lg min-h-[120px] resize-y font-mono"
                    rows={4}
                  />
                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={isSubmitting || !currentAnswer.trim()}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Controleren...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Controleer antwoord
                      </>
                    )}
                  </Button>

                  {/* Handwriting Canvas */}
                  <HandwritingCanvas />

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
                    
                    {/* Show Answer Button - Quick reveal */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuickAnswer(true)}
                      className="text-muted-foreground gap-2 hover:text-primary transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Toon antwoord
                    </Button>
                    
                    {/* Show Solution Button - Full walkthrough */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSolutionWalkthrough(true)}
                      className="text-muted-foreground gap-2 hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Toon uitwerking
                    </Button>
                    
                    {/* Theory Refresh Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadTheoryRefresh}
                      className="text-muted-foreground gap-2 hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Theorie opfrissen
                    </Button>
                  </div>

                  {/* Quick Answer Display */}
                  {showQuickAnswer && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-start gap-3">
                        <Eye className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-primary mb-1">Correct antwoord</p>
                          <div className="text-base font-medium">
                            <MathRenderer latex={currentQuestion.correct_answer} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
            diagnosticQuestionId={currentQuestion.id}
          />

          {/* Theory Refresh Modal */}
          <Dialog open={showTheoryRefresh} onOpenChange={setShowTheoryRefresh}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Theorie opfrissen
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {isLoadingTheory ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Theorie wordt geladen...</p>
                  </div>
                ) : theoryContent ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div className="text-sm leading-relaxed">
                          <MathRenderer latex={theoryContent} />
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowTheoryRefresh(false)} 
                      className="w-full"
                    >
                      Begrepen, terug naar de vraag
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Geen theorie beschikbaar voor deze vraag.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
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
