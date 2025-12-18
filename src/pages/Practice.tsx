import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, Sparkles, Trophy, ChevronRight, Moon, Sun, Clock, TrendingUp, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ExerciseView from '@/components/ExerciseView';
import ConversationalLearnView from '@/components/learning/ConversationalLearnView';
import { PracticePlan } from '@/components/learning/ConversationalStep';

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

interface Subtopic {
  id: string;
  name: string;
  order_index: number;
  theory_explanation: string | null;
  worked_examples: WorkedExample[] | null;
}

interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

interface Exercise {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[] | null;
}

interface MiniExercise {
  question: string;
  hint: string;
}

interface AIFeedback {
  what_went_well: string;
  where_it_breaks: string;
  what_to_focus_on_next: string;
  is_correct: boolean;
  suggested_difficulty: 'easy' | 'medium' | 'hard';
  misconception_tag?: string;
  explanation_variant?: number;
  mini_exercise?: MiniExercise;
  alternative_approach?: string;
}

interface SessionStats {
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  xpGained: number;
}

type PracticeMode = 'browsing' | 'learning' | 'practicing' | 'completed';

const XP_REWARDS = { easy: 5, medium: 10, hard: 20 };

// Helper to determine smart starting difficulty based on student performance
const determineStartingDifficulty = async (
  supabase: any, 
  userId: string, 
  subtopicId: string
): Promise<{ difficulty: 'easy' | 'medium' | 'hard'; subLevel: number }> => {
  try {
    // Check subtopic progress
    const { data: progress } = await supabase
      .from('user_subtopic_progress')
      .select('mastery_percentage, exercises_completed, exercises_correct')
      .eq('user_id', userId)
      .eq('subtopic_id', subtopicId)
      .single();

    if (progress) {
      const mastery = progress.mastery_percentage || 0;
      const completed = progress.exercises_completed || 0;
      
      if (completed >= 5) {
        // Has some history - use mastery to determine
        if (mastery >= 80) {
          return { difficulty: 'hard', subLevel: 2 };
        } else if (mastery >= 50) {
          return { difficulty: 'medium', subLevel: 2 };
        } else if (mastery >= 30) {
          return { difficulty: 'easy', subLevel: 3 }; // Harder easy
        }
      }
    }

    // Check recent attempts for this subtopic
    const { data: recentAttempts } = await supabase
      .from('exercise_attempts')
      .select(`
        is_correct,
        exercises!inner(difficulty, subtopic_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const subtopicAttempts = (recentAttempts || []).filter(
      (a: any) => a.exercises?.subtopic_id === subtopicId
    );

    if (subtopicAttempts.length >= 3) {
      const correctRate = subtopicAttempts.filter((a: any) => a.is_correct).length / subtopicAttempts.length;
      if (correctRate >= 0.8) {
        return { difficulty: 'medium', subLevel: 2 };
      } else if (correctRate < 0.3) {
        return { difficulty: 'easy', subLevel: 1 }; // Very easy
      }
    }

    // Default: start with easy, sub-level 2 (middle of easy)
    return { difficulty: 'easy', subLevel: 2 };
  } catch (error) {
    console.error('Error determining starting difficulty:', error);
    return { difficulty: 'easy', subLevel: 2 };
  }
};

export default function Practice() {
  const { topicId } = useParams<{ topicId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<PracticeMode>('browsing');
  
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [currentSubLevel, setCurrentSubLevel] = useState<number>(2); // 1-3 within each tier
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [exercisesAttempted, setExercisesAttempted] = useState(0);
  const [exercisesCorrect, setExercisesCorrect] = useState(0);
  const [attemptedExerciseIds, setAttemptedExerciseIds] = useState<Set<string>>(new Set());
  const [hintsUsedThisExercise, setHintsUsedThisExercise] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [practicePlan, setPracticePlan] = useState<PracticePlan | null>(null);
  const [planExercisesRemaining, setPlanExercisesRemaining] = useState<{ easy: number; medium: number; hard: number } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && topicId) {
      loadTopic();
    }
  }, [user, topicId]);

  const loadTopic = async () => {
    try {
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();
      
      if (topicError) throw topicError;
      setTopic(topicData);

      const { data: subtopicsData, error: subtopicsError } = await supabase
        .from('subtopics')
        .select('*')
        .eq('topic_id', topicId)
        .order('order_index');
      
      if (subtopicsError) throw subtopicsError;
      
      const parsedSubtopics = (subtopicsData || []).map(s => ({
        ...s,
        worked_examples: (Array.isArray(s.worked_examples) ? s.worked_examples : []) as unknown as WorkedExample[],
      }));
      
      setSubtopics(parsedSubtopics);
    } catch (error) {
      console.error('Error loading topic:', error);
      toast.error('Failed to load topic. Please try again.');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExercise = useCallback(async (subtopicId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    try {
      let query = supabase
        .from('exercises_public')
        .select('*')
        .eq('subtopic_id', subtopicId)
        .eq('difficulty', difficulty);
      
      if (attemptedExerciseIds.size > 0) {
        query = query.not('id', 'in', `(${Array.from(attemptedExerciseIds).join(',')})`);
      }
      
      let { data: exercises, error } = await query.limit(10);
      
      if (error) throw error;
      
      if (!exercises || exercises.length === 0) {
        const fallbackDifficulties = difficulty === 'medium' 
          ? ['easy', 'hard'] 
          : difficulty === 'easy' 
            ? ['medium', 'hard'] 
            : ['medium', 'easy'];
        
        for (const fallbackDiff of fallbackDifficulties) {
          const { data: fallbackExercises } = await supabase
            .from('exercises_public')
            .select('*')
            .eq('subtopic_id', subtopicId)
            .eq('difficulty', fallbackDiff as 'easy' | 'medium' | 'hard')
            .limit(5);
          
          if (fallbackExercises && fallbackExercises.length > 0) {
            exercises = fallbackExercises;
            setCurrentDifficulty(fallbackDiff as 'easy' | 'medium' | 'hard');
            break;
          }
        }
      }

      if (!exercises || exercises.length === 0) {
        toast.info('Generating a new exercise for you...');
        
        const { data, error: genError } = await supabase.functions.invoke('generate-exercise', {
          body: { subtopicId, difficulty, existingExercises: [], userId: user?.id }
        });
        
        if (genError) throw genError;
        if (data && !data.error) {
          setCurrentExercise({
            id: data.id,
            question: data.question,
            difficulty: data.difficulty,
            hints: data.hints,
          });
          return;
        }
        
        toast.error('No exercises available for this subtopic yet.');
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * exercises.length);
      setCurrentExercise(exercises[randomIndex] as Exercise);
    } catch (error) {
      console.error('Error loading exercise:', error);
      toast.error('Failed to load exercise. Please try again.');
    }
  }, [attemptedExerciseIds]);

  const handleSubtopicClick = (subtopic: Subtopic) => {
    setSelectedSubtopic(subtopic);
    setMode('learning');
  };

  const startPractice = async (plan?: PracticePlan) => {
    if (!selectedSubtopic || !user) return;
    setMode('practicing');
    setExercisesAttempted(0);
    setExercisesCorrect(0);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
    setAttemptedExerciseIds(new Set());
    setHintsUsedThisExercise(0);
    setSessionStartTime(new Date());
    
    // Store the practice plan if provided
    if (plan) {
      setPracticePlan(plan);
      setPlanExercisesRemaining({ ...plan.breakdown });
    } else {
      setPracticePlan(null);
      setPlanExercisesRemaining(null);
    }
    
    // Determine starting difficulty based on plan or student history
    let startDifficulty: 'easy' | 'medium' | 'hard' = 'easy';
    let subLevel = 2;
    
    if (plan && plan.breakdown.easy > 0) {
      startDifficulty = 'easy';
    } else if (plan && plan.breakdown.medium > 0) {
      startDifficulty = 'medium';
    } else if (plan && plan.breakdown.hard > 0) {
      startDifficulty = 'hard';
    } else {
      // No plan, use smart difficulty determination
      const result = await determineStartingDifficulty(supabase, user.id, selectedSubtopic.id);
      startDifficulty = result.difficulty;
      subLevel = result.subLevel;
    }
    
    setCurrentDifficulty(startDifficulty);
    setCurrentSubLevel(subLevel);
    
    await loadExercise(selectedSubtopic.id, startDifficulty);
  };

  const handleHintReveal = () => {
    setHintsUsedThisExercise(prev => prev + 1);
  };

  const handleSubmitAnswer = async (answer: string): Promise<{ isCorrect: boolean; explanation: string | null; correctAnswer?: string; tutorFeedback?: { what_went_well: string; where_it_breaks: string; what_to_focus_on_next: string } | null }> => {
    if (!currentExercise || !user || !selectedSubtopic) {
      return { isCorrect: false, explanation: null };
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-exercise-answer', {
        body: {
          exerciseId: currentExercise.id,
          userAnswer: answer,
          userId: user.id,
          hintsUsed: hintsUsedThisExercise,
          subtopicName: selectedSubtopic.name,
        },
      });

      if (error) throw error;

      const { isCorrect, explanation, correctAnswer, tutorFeedback, suggestedDifficulty, suggestedSubLevel, consecutiveCorrect: newConsecCorrect, consecutiveWrong: newConsecWrong } = data;
      
      if (suggestedDifficulty) {
        setCurrentDifficulty(suggestedDifficulty);
      }
      if (suggestedSubLevel) {
        setCurrentSubLevel(suggestedSubLevel);
      }
      if (newConsecCorrect !== undefined) {
        setConsecutiveCorrect(newConsecCorrect);
      }
      if (newConsecWrong !== undefined) {
        setConsecutiveWrong(newConsecWrong);
      }
      
      setAttemptedExerciseIds(prev => new Set(prev).add(currentExercise.id));
      setExercisesAttempted(prev => prev + 1);
      
      if (isCorrect) {
        setExercisesCorrect(prev => prev + 1);
        setConsecutiveCorrect(prev => prev + 1);
        setConsecutiveWrong(0);
        
        const xpGain = XP_REWARDS[currentExercise.difficulty];
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          await supabase
            .from('profiles')
            .update({ total_xp: profile.total_xp + xpGain })
            .eq('id', user.id);
        }
        
        toast.success(`+${xpGain} XP!`);
        await updateStreak();
      } else {
        setConsecutiveWrong(prev => prev + 1);
        setConsecutiveCorrect(0);
      }
      
      await updateTopicProgress(isCorrect);
      await updateSubtopicProgress(selectedSubtopic.id, isCorrect, hintsUsedThisExercise);
      
      return { isCorrect, explanation, correctAnswer, tutorFeedback };
    } catch (error) {
      console.error('Error submitting answer:', error);
      return { isCorrect: false, explanation: null };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitImage = async (file: File): Promise<AIFeedback> => {
    if (!currentExercise || !user || !selectedSubtopic) {
      return {
        what_went_well: '',
        where_it_breaks: 'No exercise loaded',
        what_to_focus_on_next: '',
        is_correct: false,
        suggested_difficulty: currentDifficulty,
      };
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: previousAttempts } = await supabase
        .from('exercise_attempts')
        .select('misconception_tag, explanation_variant, ai_feedback')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const fileName = `${user.id}/${currentExercise.id}_${Date.now()}.jpg`;
      await supabase.storage.from('handwritten-work').upload(fileName, file);
      
      const { data, error } = await supabase.functions.invoke('analyze-handwritten-work', {
        body: {
          imageBase64: base64,
          exerciseId: currentExercise.id,
          question: currentExercise.question,
          difficulty: currentExercise.difficulty,
          previousAttempts: previousAttempts || [],
          subtopicName: selectedSubtopic.name,
        }
      });
      
      if (error) throw error;
      
      const feedback = data as AIFeedback;
      
      await supabase.from('exercise_attempts').insert({
        user_id: user.id,
        exercise_id: currentExercise.id,
        user_answer: '[handwritten work]',
        is_correct: feedback.is_correct,
        ai_feedback: JSON.stringify(feedback),
        hints_used: hintsUsedThisExercise,
        misconception_tag: feedback.misconception_tag || null,
        explanation_variant: feedback.explanation_variant || 1,
      });
      
      setAttemptedExerciseIds(prev => new Set(prev).add(currentExercise.id));
      setExercisesAttempted(prev => prev + 1);
      
      if (feedback.is_correct) {
        setExercisesCorrect(prev => prev + 1);
        setConsecutiveCorrect(prev => prev + 1);
        setConsecutiveWrong(0);
        
        const xpGain = XP_REWARDS[currentExercise.difficulty];
        toast.success(`+${xpGain} XP!`);
        await updateStreak();
      } else {
        setConsecutiveWrong(prev => prev + 1);
        setConsecutiveCorrect(0);
      }
      
      await updateTopicProgress(feedback.is_correct);
      await updateSubtopicProgress(selectedSubtopic.id, feedback.is_correct, hintsUsedThisExercise);
      
      return feedback;
    } catch (error) {
      console.error('Error analyzing handwritten work:', error);
      toast.error('Failed to analyze your work. Please try again.');
      return {
        what_went_well: 'Unable to analyze at this time.',
        where_it_breaks: 'Please try again or use text input.',
        what_to_focus_on_next: 'Keep practicing!',
        is_correct: false,
        suggested_difficulty: currentDifficulty,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextExercise = async (suggestedDifficulty?: 'easy' | 'medium' | 'hard') => {
    if (!selectedSubtopic) return;
    
    setHintsUsedThisExercise(0);
    
    let nextDifficulty = currentDifficulty;
    
    // If we have a practice plan, follow it
    if (planExercisesRemaining) {
      // Update remaining counts based on current exercise
      const newRemaining = { ...planExercisesRemaining };
      if (newRemaining[currentDifficulty] > 0) {
        newRemaining[currentDifficulty]--;
      }
      setPlanExercisesRemaining(newRemaining);
      
      // Determine next difficulty based on plan
      if (newRemaining.easy > 0) {
        nextDifficulty = 'easy';
      } else if (newRemaining.medium > 0) {
        nextDifficulty = 'medium';
      } else if (newRemaining.hard > 0) {
        nextDifficulty = 'hard';
      } else {
        // Plan complete!
        finishPractice();
        return;
      }
    } else {
      // No plan - use adaptive difficulty
      if (suggestedDifficulty) {
        nextDifficulty = suggestedDifficulty;
      } else if (consecutiveCorrect >= 2 && currentDifficulty !== 'hard') {
        nextDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
        toast.info('Great job! Moving to harder exercises');
      } else if (consecutiveWrong >= 2 && currentDifficulty !== 'easy') {
        nextDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
        toast.info("Let's practice some easier ones first");
      }
    }
    
    setCurrentDifficulty(nextDifficulty);
    setCurrentExercise(null);
    await loadExercise(selectedSubtopic.id, nextDifficulty);
  };

  const finishPractice = () => {
    const timeSpent = sessionStartTime 
      ? Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000)
      : 0;
    
    const xpGained = exercisesCorrect * XP_REWARDS[currentDifficulty];
    
    setSessionStats({
      correctAnswers: exercisesCorrect,
      totalQuestions: exercisesAttempted,
      timeSpent,
      xpGained,
    });
    setMode('completed');
  };

  const updateStreak = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_practice_date, current_streak, longest_streak')
      .eq('id', user.id)
      .single();
    
    if (!profile) return;
    
    const lastPractice = profile.last_practice_date;
    let newStreak = 1;
    
    if (lastPractice) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastPractice === today) {
        newStreak = profile.current_streak;
      } else if (lastPractice === yesterdayStr) {
        newStreak = profile.current_streak + 1;
      }
    }
    
    const longestStreak = Math.max(newStreak, profile.longest_streak);
    
    await supabase.from('profiles').update({
      last_practice_date: today,
      current_streak: newStreak,
      longest_streak: longestStreak,
    }).eq('id', user.id);
  };

  const updateTopicProgress = async (isCorrect: boolean) => {
    if (!user || !topicId) return;
    
    const { data: existing } = await supabase
      .from('user_topic_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic_id', topicId)
      .single();
    
    if (existing) {
      const newCompleted = existing.exercises_completed + 1;
      const newCorrect = existing.exercises_correct + (isCorrect ? 1 : 0);
      const mastery = Math.round((newCorrect / newCompleted) * 100);
      
      await supabase.from('user_topic_progress').update({
        exercises_completed: newCompleted,
        exercises_correct: newCorrect,
        mastery_percentage: mastery,
      }).eq('id', existing.id);
    } else {
      await supabase.from('user_topic_progress').insert({
        user_id: user.id,
        topic_id: topicId,
        exercises_completed: 1,
        exercises_correct: isCorrect ? 1 : 0,
        mastery_percentage: isCorrect ? 100 : 0,
      });
    }
  };

  const updateSubtopicProgress = async (subtopicId: string, isCorrect: boolean, hintsUsed: number) => {
    if (!user) return;
    
    const { data: existing } = await supabase
      .from('user_subtopic_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('subtopic_id', subtopicId)
      .single();
    
    if (existing) {
      const newCompleted = existing.exercises_completed + 1;
      const newCorrect = existing.exercises_correct + (isCorrect ? 1 : 0);
      const newHints = existing.hints_used + hintsUsed;
      const mastery = Math.round((newCorrect / newCompleted) * 100);
      
      await supabase.from('user_subtopic_progress').update({
        exercises_completed: newCompleted,
        exercises_correct: newCorrect,
        hints_used: newHints,
        mastery_percentage: mastery,
      }).eq('id', existing.id);
    } else {
      await supabase.from('user_subtopic_progress').insert({
        user_id: user.id,
        subtopic_id: subtopicId,
        exercises_completed: 1,
        exercises_correct: isCorrect ? 1 : 0,
        hints_used: hintsUsed,
        mastery_percentage: isCorrect ? 100 : 0,
      });
    }
  };

  const exitPractice = () => {
    if (mode === 'practicing') {
      if (exercisesAttempted > 0) {
        finishPractice();
      } else {
        setMode('learning');
        setCurrentExercise(null);
        setHintsUsedThisExercise(0);
      }
    } else if (mode === 'completed') {
      setMode('learning');
      setSessionStats(null);
    } else {
      setMode('browsing');
      setSelectedSubtopic(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getNextSubtopic = () => {
    if (!selectedSubtopic) return null;
    const currentIndex = subtopics.findIndex(s => s.id === selectedSubtopic.id);
    return subtopics[currentIndex + 1] || null;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsla(239, 84%, 67%, 0.06) 0%, transparent 50%)',
          }}
        />
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-primary/3 blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-secondary/3 blur-[100px] animate-float-slow" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b border-border/30">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={mode === 'browsing' ? () => navigate('/') : exitPractice}
              className="text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {mode === 'browsing' ? 'Back to Topics' : mode === 'learning' ? 'Back to Subtopics' : mode === 'completed' ? 'Back to Learn' : 'Exit Practice'}
            </Button>
            
            {mode === 'practicing' && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{topic?.name}</span>
                {practicePlan ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Plan Progress</span>
                    <span className="font-semibold text-foreground">
                      {exercisesAttempted}/{practicePlan.totalExercises}
                    </span>
                    <Progress 
                      value={(exercisesAttempted / practicePlan.totalExercises) * 100} 
                      className="w-24 h-2"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Progress</span>
                    <span className="font-semibold text-foreground">{exercisesCorrect}/{exercisesAttempted > 0 ? exercisesAttempted : '?'}</span>
                    <Progress 
                      value={exercisesAttempted > 0 ? (exercisesCorrect / exercisesAttempted) * 100 : 0} 
                      className="w-24 h-2"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {/* Browsing Mode - Topic Overview */}
            {mode === 'browsing' && (
              <motion.div
                key="browsing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Topic Header */}
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-medium">Topic</span>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                    {topic?.name?.split(' ').map((word, i) => (
                      <span key={i}>
                        {i === 0 ? word : <><br /><span className="text-primary/80">&</span> {word}</>}
                      </span>
                    ))}
                  </h1>
                  
                  {topic?.description && (
                    <p className="text-lg text-muted-foreground max-w-xl">
                      {topic.description}
                    </p>
                  )}
                </div>

                {/* Subtopics */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Subtopics</h2>
                  </div>
                  
                  {subtopics.length === 0 ? (
                    <div className="p-12 rounded-2xl bg-card border border-border/50 text-center">
                      <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                      <p className="text-muted-foreground">
                        Exercises coming soon! We're preparing content for this topic.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subtopics.map((subtopic, index) => (
                        <motion.button
                          key={subtopic.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSubtopicClick(subtopic)}
                          className="w-full p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:bg-card/80 transition-all text-left group shadow-lg shadow-black/5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                {index + 1}
                              </span>
                              <span className="font-medium text-foreground text-lg group-hover:text-primary transition-colors">
                                {subtopic.name}
                              </span>
                            </div>
                            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary/40 transition-colors">
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span>Learning active</span>
                  </div>
                  <span className="italic opacity-60">Understanding, not memorization.</span>
                </div>
              </motion.div>
            )}

            {/* Learning Mode */}
            {mode === 'learning' && selectedSubtopic && (
              <motion.div
                key="learning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ConversationalLearnView
                  subtopicName={selectedSubtopic.name}
                  subtopicId={selectedSubtopic.id}
                  topicName={topic?.name || ''}
                  theoryExplanation={selectedSubtopic.theory_explanation}
                  workedExamples={selectedSubtopic.worked_examples || []}
                  onStartPractice={startPractice}
                  onBack={() => {
                    setMode('browsing');
                    setSelectedSubtopic(null);
                  }}
                />
              </motion.div>
            )}

            {/* Practicing Mode */}
            {mode === 'practicing' && (
              <motion.div
                key="practicing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Subtopic header with plan info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary font-medium uppercase tracking-wide">{selectedSubtopic?.name}</span>
                  </div>
                  {practicePlan && planExercisesRemaining && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-500">🌱 {planExercisesRemaining.easy}</span>
                      <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500">🌿 {planExercisesRemaining.medium}</span>
                      <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-500">🌳 {planExercisesRemaining.hard}</span>
                    </div>
                  )}
                </div>
                
                {/* Exercise */}
                {currentExercise ? (
                  <ExerciseView
                    exercise={currentExercise}
                    subtopicName={selectedSubtopic?.name || ''}
                    currentDifficulty={currentDifficulty}
                    currentSubLevel={currentSubLevel}
                    onSubmitAnswer={handleSubmitAnswer}
                    onSubmitImage={handleSubmitImage}
                    onNextExercise={handleNextExercise}
                    onHintReveal={handleHintReveal}
                    onFinishPractice={finishPractice}
                    isSubmitting={isSubmitting}
                    exercisesAttempted={exercisesAttempted}
                  />
                ) : (
                  <div className="p-16 rounded-2xl bg-card border border-border/50 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <p className="text-muted-foreground">Loading exercise...</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Completed Mode - Results */}
            {mode === 'completed' && sessionStats && (() => {
              const accuracy = sessionStats.totalQuestions > 0 
                ? Math.round((sessionStats.correctAnswers / sessionStats.totalQuestions) * 100)
                : 0;
              
              const getCompletionFeedback = () => {
                if (accuracy >= 90) {
                  return {
                    title: "Excellent Progress",
                    message: `You've demonstrated a strong understanding of ${selectedSubtopic?.name}. Keep maintaining this momentum.`,
                    color: "hsl(142, 76%, 36%)", // green
                    colorClass: "text-green-500",
                    bgClass: "bg-green-500/10",
                    borderClass: "border-green-500/20"
                  };
                } else if (accuracy >= 70) {
                  return {
                    title: "Great Work",
                    message: `You're making solid progress in ${selectedSubtopic?.name}. A bit more practice and you'll master it.`,
                    color: "hsl(142, 76%, 36%)", // green
                    colorClass: "text-green-500",
                    bgClass: "bg-green-500/10",
                    borderClass: "border-green-500/20"
                  };
                } else if (accuracy >= 50) {
                  return {
                    title: "Keep Practicing",
                    message: `You're getting there with ${selectedSubtopic?.name}. Focus on the concepts you found challenging.`,
                    color: "hsl(45, 93%, 47%)", // yellow/amber
                    colorClass: "text-yellow-500",
                    bgClass: "bg-yellow-500/10",
                    borderClass: "border-yellow-500/20"
                  };
                } else if (accuracy >= 25) {
                  return {
                    title: "Room to Grow",
                    message: `${selectedSubtopic?.name} needs more attention. Review the theory and try again with a fresh perspective.`,
                    color: "hsl(25, 95%, 53%)", // orange
                    colorClass: "text-orange-500",
                    bgClass: "bg-orange-500/10",
                    borderClass: "border-orange-500/20"
                  };
                } else {
                  return {
                    title: "Focus Needed",
                    message: `${selectedSubtopic?.name} requires more practice. Consider reviewing the theory section before trying again.`,
                    color: "hsl(0, 84%, 60%)", // red
                    colorClass: "text-red-500",
                    bgClass: "bg-red-500/10",
                    borderClass: "border-red-500/20"
                  };
                }
              };
              
              const feedback = getCompletionFeedback();
              
              return (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center space-y-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${feedback.bgClass} border ${feedback.borderClass}`}>
                    <Sparkles className={`w-4 h-4 ${feedback.colorClass}`} />
                    <span className={`text-sm ${feedback.colorClass} font-medium`}>Practice Complete</span>
                  </div>
                  
                  <h1 className={`text-4xl md:text-5xl font-bold ${feedback.colorClass}`}>
                    {feedback.title}
                  </h1>
                  
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {feedback.message}
                  </p>
                </div>

                {/* Stats Card */}
                <div className="p-8 rounded-2xl bg-card border border-border/50">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Accuracy Circle */}
                    <div className="relative w-48 h-48 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="hsl(var(--border))"
                          strokeWidth="6"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={feedback.color}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${(sessionStats.correctAnswers / sessionStats.totalQuestions) * 283} 283`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${feedback.colorClass}`}>
                          {accuracy}%
                        </span>
                        <span className="text-sm text-muted-foreground uppercase tracking-wide">Accuracy</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 space-y-4">
                      <div className="p-4 rounded-xl bg-muted/30 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Correct Answers</p>
                          <p className="text-xl font-bold text-foreground">{sessionStats.correctAnswers} of {sessionStats.totalQuestions}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-muted/30 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Time Spent</p>
                          <p className="text-xl font-bold text-foreground">{formatTime(sessionStats.timeSpent)}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-muted/30 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">XP Gained</p>
                          <p className="text-xl font-bold text-foreground">+{sessionStats.xpGained} XP</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setMode('practicing');
                      setSessionStats(null);
                      setExercisesAttempted(0);
                      setExercisesCorrect(0);
                      setSessionStartTime(new Date());
                      loadExercise(selectedSubtopic!.id, 'easy');
                    }}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry Practice
                  </Button>
                  
                  {getNextSubtopic() && (
                    <Button
                      size="lg"
                      onClick={() => {
                        const nextSubtopic = getNextSubtopic();
                        if (nextSubtopic) {
                          setSelectedSubtopic(nextSubtopic);
                          setMode('learning');
                          setSessionStats(null);
                        }
                      }}
                      className="gap-2"
                    >
                      Next Lesson: {getNextSubtopic()?.name}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
              );
            })()}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
