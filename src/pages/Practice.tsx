import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, Sparkles, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import ExerciseView from '@/components/ExerciseView';

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

interface Subtopic {
  id: string;
  name: string;
  order_index: number;
}

interface Exercise {
  id: string;
  question: string;
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[] | null;
  explanation: string | null;
}

interface AIFeedback {
  what_went_well: string;
  where_it_breaks: string;
  what_to_focus_on_next: string;
  is_correct: boolean;
  suggested_difficulty: 'easy' | 'medium' | 'hard';
}

type PracticeMode = 'browsing' | 'practicing';

const XP_REWARDS = { easy: 5, medium: 10, hard: 20 };

export default function Practice() {
  const { topicId } = useParams<{ topicId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<PracticeMode>('browsing');
  
  // Practice state
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [exercisesAttempted, setExercisesAttempted] = useState(0);
  const [exercisesCorrect, setExercisesCorrect] = useState(0);
  const [attemptedExerciseIds, setAttemptedExerciseIds] = useState<Set<string>>(new Set());

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
      setSubtopics(subtopicsData || []);
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
      // First try to find an exercise at the requested difficulty
      let query = supabase
        .from('exercises')
        .select('*')
        .eq('subtopic_id', subtopicId)
        .eq('difficulty', difficulty);
      
      // Exclude already attempted exercises if possible
      if (attemptedExerciseIds.size > 0) {
        query = query.not('id', 'in', `(${Array.from(attemptedExerciseIds).join(',')})`);
      }
      
      let { data: exercises, error } = await query.limit(10);
      
      if (error) throw error;
      
      // If no exercises at this difficulty, try adjacent difficulties
      if (!exercises || exercises.length === 0) {
        const fallbackDifficulties = difficulty === 'medium' 
          ? ['easy', 'hard'] 
          : difficulty === 'easy' 
            ? ['medium', 'hard'] 
            : ['medium', 'easy'];
        
        for (const fallbackDiff of fallbackDifficulties) {
          const { data: fallbackExercises } = await supabase
            .from('exercises')
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

      // If still no exercises, try to generate one
      if (!exercises || exercises.length === 0) {
        toast.info('Generating a new exercise for you...');
        
        const { data, error: genError } = await supabase.functions.invoke('generate-exercise', {
          body: { subtopicId, difficulty, existingExercises: [] }
        });
        
        if (genError) throw genError;
        if (data && !data.error) {
          setCurrentExercise(data);
          return;
        }
        
        toast.error('No exercises available for this subtopic yet.');
        return;
      }
      
      // Pick a random exercise from available ones
      const randomIndex = Math.floor(Math.random() * exercises.length);
      setCurrentExercise(exercises[randomIndex]);
    } catch (error) {
      console.error('Error loading exercise:', error);
      toast.error('Failed to load exercise. Please try again.');
    }
  }, [attemptedExerciseIds]);

  const startPractice = async (subtopic: Subtopic) => {
    setSelectedSubtopic(subtopic);
    setMode('practicing');
    setExercisesAttempted(0);
    setExercisesCorrect(0);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
    setCurrentDifficulty('easy');
    setAttemptedExerciseIds(new Set());
    await loadExercise(subtopic.id, 'easy');
  };

  const handleSubmitAnswer = async (answer: string): Promise<{ isCorrect: boolean; explanation: string | null }> => {
    if (!currentExercise || !user) {
      return { isCorrect: false, explanation: null };
    }
    
    setIsSubmitting(true);
    
    try {
      // Normalize answers for comparison
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/,/g, '');
      const isCorrect = normalize(answer) === normalize(currentExercise.correct_answer);
      
      // Save attempt
      await supabase.from('exercise_attempts').insert({
        user_id: user.id,
        exercise_id: currentExercise.id,
        user_answer: answer,
        is_correct: isCorrect,
      });
      
      // Update local tracking
      setAttemptedExerciseIds(prev => new Set(prev).add(currentExercise.id));
      setExercisesAttempted(prev => prev + 1);
      
      if (isCorrect) {
        setExercisesCorrect(prev => prev + 1);
        setConsecutiveCorrect(prev => prev + 1);
        setConsecutiveWrong(0);
        
        // Award XP - fetch current and update
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
        
        toast.success(`+${xpGain} XP! 🎉`);
        
        // Update streak
        await updateStreak();
      } else {
        setConsecutiveWrong(prev => prev + 1);
        setConsecutiveCorrect(0);
      }
      
      // Update topic progress
      await updateTopicProgress(isCorrect);
      
      return { isCorrect, explanation: currentExercise.explanation };
    } catch (error) {
      console.error('Error submitting answer:', error);
      return { isCorrect: false, explanation: null };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitImage = async (file: File): Promise<AIFeedback> => {
    if (!currentExercise || !user) {
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
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Upload to storage (optional - for record keeping)
      const fileName = `${user.id}/${currentExercise.id}_${Date.now()}.jpg`;
      await supabase.storage.from('handwritten-work').upload(fileName, file);
      
      // Send to AI for analysis
      const { data, error } = await supabase.functions.invoke('analyze-handwritten-work', {
        body: {
          imageBase64: base64,
          question: currentExercise.question,
          correctAnswer: currentExercise.correct_answer,
          difficulty: currentExercise.difficulty,
        }
      });
      
      if (error) throw error;
      
      const feedback = data as AIFeedback;
      
      // Save attempt with AI feedback
      await supabase.from('exercise_attempts').insert({
        user_id: user.id,
        exercise_id: currentExercise.id,
        user_answer: '[handwritten work]',
        is_correct: feedback.is_correct,
        ai_feedback: JSON.stringify(feedback),
      });
      
      // Update tracking
      setAttemptedExerciseIds(prev => new Set(prev).add(currentExercise.id));
      setExercisesAttempted(prev => prev + 1);
      
      if (feedback.is_correct) {
        setExercisesCorrect(prev => prev + 1);
        setConsecutiveCorrect(prev => prev + 1);
        setConsecutiveWrong(0);
        
        const xpGain = XP_REWARDS[currentExercise.difficulty];
        toast.success(`+${xpGain} XP! 🎉`);
        await updateStreak();
      } else {
        setConsecutiveWrong(prev => prev + 1);
        setConsecutiveCorrect(0);
      }
      
      await updateTopicProgress(feedback.is_correct);
      
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
    
    // Determine next difficulty
    let nextDifficulty = currentDifficulty;
    
    if (suggestedDifficulty) {
      nextDifficulty = suggestedDifficulty;
    } else if (consecutiveCorrect >= 2 && currentDifficulty !== 'hard') {
      nextDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
      toast.info('Great job! Moving to harder exercises 💪');
    } else if (consecutiveWrong >= 2 && currentDifficulty !== 'easy') {
      nextDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
      toast.info("Let's practice some easier ones first 📚");
    }
    
    setCurrentDifficulty(nextDifficulty);
    setCurrentExercise(null);
    await loadExercise(selectedSubtopic.id, nextDifficulty);
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

  const exitPractice = () => {
    setMode('browsing');
    setSelectedSubtopic(null);
    setCurrentExercise(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-24 w-full" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={mode === 'practicing' ? exitPractice : () => navigate('/')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {mode === 'practicing' ? 'Exit Practice' : 'Back to Topics'}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {mode === 'browsing' ? (
          <>
            {/* Topic header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 gradient-text">
                {topic?.name}
              </h1>
              {topic?.description && (
                <p className="text-muted-foreground">{topic.description}</p>
              )}
            </div>

            {/* Subtopics */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Subtopics</h2>
              </div>
              
              {subtopics.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="py-12 text-center">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Exercises coming soon! We're preparing content for this topic.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {subtopics.map((subtopic, index) => (
                    <Card 
                      key={subtopic.id}
                      className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => startPractice(subtopic)}
                    >
                      <CardHeader className="py-4">
                        <CardTitle className="text-base font-medium flex items-center justify-between">
                          <span>{subtopic.name}</span>
                          <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
                            Start Practice →
                          </span>
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Practice Mode */}
            <div className="space-y-4">
              {/* Practice header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{topic?.name}</p>
                  <h2 className="text-xl font-semibold">{selectedSubtopic?.name}</h2>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span>{exercisesCorrect}/{exercisesAttempted}</span>
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              {exercisesAttempted > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Session accuracy</span>
                    <span>{exercisesAttempted > 0 ? Math.round((exercisesCorrect / exercisesAttempted) * 100) : 0}%</span>
                  </div>
                  <Progress 
                    value={exercisesAttempted > 0 ? (exercisesCorrect / exercisesAttempted) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
            
            {/* Exercise */}
            {currentExercise ? (
              <ExerciseView
                exercise={currentExercise}
                onSubmitAnswer={handleSubmitAnswer}
                onSubmitImage={handleSubmitImage}
                onNextExercise={handleNextExercise}
                isSubmitting={isSubmitting}
              />
            ) : (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                  <p className="text-muted-foreground">Loading exercise...</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
