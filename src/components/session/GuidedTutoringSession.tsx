import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useTutorTTS } from '@/hooks/useTutorTTS';
import MathRenderer from '@/components/MathRenderer';
import { ElevenLabsAgent } from '@/components/tutor/ElevenLabsAgent';
import { SolutionWalkthrough } from '@/components/exercise/SolutionWalkthrough';
import { TalkToTutorButton } from '@/components/tutor/TalkToTutorButton';
import ToolPanel from '@/components/tools/ToolPanel';
import { 
  Send, 
  Volume2, 
  VolumeX,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  Home,
  PlayCircle,
  Focus,
  Eye,
  Timer,
  TrendingUp,
  Zap,
  BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type SessionPhase = 'greeting' | 'exercise' | 'feedback' | 'wrap-up' | 'completed';

interface Exercise {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[] | null;
}

interface SessionStats {
  correct: number;
  total: number;
  xpEarned: number;
}

interface PerformanceData {
  correctStreak: number;
  incorrectStreak: number;
  accuracy: number;
  exercisesAtCurrentDifficulty: number;
}

interface ExerciseTimeData {
  exerciseNumber: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeSpentSeconds: number;
  isCorrect: boolean;
}

interface DifficultyProgression {
  fromDifficulty: 'easy' | 'medium' | 'hard';
  toDifficulty: 'easy' | 'medium' | 'hard';
  afterExercise: number;
}

interface GuidedTutoringSessionProps {
  subtopicId: string;
  subtopicName: string;
  onEndSession: () => void;
}

export function GuidedTutoringSession({
  subtopicId,
  subtopicName,
  onEndSession,
}: GuidedTutoringSessionProps) {
  const { user } = useAuth();
  const exerciseContext = useExerciseContext();
  const [phase, setPhase] = useState<SessionPhase>('greeting');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState<string | undefined>();
  const [stats, setStats] = useState<SessionStats>({ correct: 0, total: 0, xpEarned: 0 });
  const [currentFeedback, setCurrentFeedback] = useState<{
    isCorrect: boolean;
    message: string;
    tutorFeedback?: any;
  } | null>(null);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [wrapUpMessage, setWrapUpMessage] = useState('');
  const [exerciseGoal] = useState(5); // Session goal: 5 exercises
  const [tutorMood, setTutorMood] = useState<'idle' | 'explaining' | 'celebrating' | 'thinking' | 'encouraging'>('idle');
  
  // Track used exercises to prevent duplicates
  const [usedExerciseIds, setUsedExerciseIds] = useState<string[]>([]);
  
  // Track performance for progressive difficulty
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    correctStreak: 0,
    incorrectStreak: 0,
    accuracy: 0,
    exercisesAtCurrentDifficulty: 0,
  });
  
  // Student's mastery level (fetched at session start)
  const [studentMastery, setStudentMastery] = useState<number>(0);
  
  // Time tracking for analytics
  const [exerciseStartTime, setExerciseStartTime] = useState<number>(Date.now());
  const [sessionStartTime] = useState<number>(Date.now());
  const [exerciseTimings, setExerciseTimings] = useState<ExerciseTimeData[]>([]);
  const [difficultyProgressions, setDifficultyProgressions] = useState<DifficultyProgression[]>([]);

  const { speak, stopSpeaking, isSpeaking } = useTutorTTS({
    personality: 'friendly',
    defaultContext: 'default',
    onSpeakStart: () => {
      if (phase === 'greeting' || phase === 'wrap-up') {
        setTutorMood('explaining');
      }
    },
    onSpeakEnd: () => {
      if (phase === 'greeting') {
        // Auto-advance to exercise after greeting
        setTimeout(() => loadNextExercise(), 500);
      } else if (phase === 'wrap-up') {
        setPhase('completed');
      }
    },
  });

  // Start session with a greeting
  useEffect(() => {
    startSession();
  }, []);

  // Listen for Gilbert's tool call events
  useEffect(() => {
    const handleEasier = () => {
      console.log('Gilbert requested easier exercise');
      setCurrentDifficulty(prev => prev === 'hard' ? 'medium' : 'easy');
      loadNextExercise();
    };
    
    const handleHarder = () => {
      console.log('Gilbert requested harder exercise');
      setCurrentDifficulty(prev => prev === 'easy' ? 'medium' : 'hard');
      loadNextExercise();
    };

    const handleShowSolution = () => {
      setShowWalkthrough(true);
    };
    
    window.addEventListener('gilbert-request-easier', handleEasier);
    window.addEventListener('gilbert-request-harder', handleHarder);
    window.addEventListener('gilbert-show-solution', handleShowSolution);
    
    return () => {
      window.removeEventListener('gilbert-request-easier', handleEasier);
      window.removeEventListener('gilbert-request-harder', handleHarder);
      window.removeEventListener('gilbert-show-solution', handleShowSolution);
    };
  }, []);

  // Fetch student mastery at session start
  const fetchStudentMastery = useCallback(async () => {
    if (!user) return;
    
    try {
      // Try to get subtopic-specific progress first
      const { data: subtopicProgress } = await supabase
        .from('user_subtopic_progress')
        .select('mastery_percentage')
        .eq('user_id', user.id)
        .eq('subtopic_id', subtopicId)
        .single();
      
      if (subtopicProgress) {
        const mastery = subtopicProgress.mastery_percentage;
        setStudentMastery(mastery);
        
        // Set initial difficulty based on mastery level
        if (mastery >= 61) {
          setCurrentDifficulty('hard');
        } else if (mastery >= 31) {
          setCurrentDifficulty('medium');
        } else {
          setCurrentDifficulty('easy');
        }
        return;
      }
      
      // Fallback to learning profile if no subtopic progress
      const { data: topicData } = await supabase
        .from('subtopics')
        .select('topic_id')
        .eq('id', subtopicId)
        .single();
      
      if (topicData) {
        const { data: learningProfile } = await supabase
          .from('learning_profiles')
          .select('subtopic_levels, overall_level')
          .eq('user_id', user.id)
          .eq('topic_id', topicData.topic_id)
          .single();
        
        if (learningProfile) {
          const subtopicLevels = learningProfile.subtopic_levels as Record<string, number> || {};
          const subtopicLevel = subtopicLevels[subtopicId] || learningProfile.overall_level || 0;
          
          // Convert level (0-5 scale) to difficulty
          if (subtopicLevel >= 4) {
            setCurrentDifficulty('hard');
            setStudentMastery(80);
          } else if (subtopicLevel >= 2) {
            setCurrentDifficulty('medium');
            setStudentMastery(50);
          } else {
            setCurrentDifficulty('easy');
            setStudentMastery(20);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching student mastery:', error);
    }
  }, [user, subtopicId]);

  const startSession = async () => {
    // Fetch student mastery first
    await fetchStudentMastery();
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-session-greeting', {
        body: { 
          subtopicName, 
          userId: user?.id,
          exerciseGoal 
        },
      });

      if (error) throw error;

      const greeting = data?.greeting || `Hello! Today we're going to work on ${subtopicName}. We'll do ${exerciseGoal} exercises. Are you ready?`;
      setGreetingMessage(greeting);
      setTutorMood('explaining');

      if (!isMuted) {
        speak(greeting, 'encouraging');
      } else {
        setTimeout(() => loadNextExercise(), 2000);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      const fallbackGreeting = `Hello! Let's get started with ${subtopicName}. We'll do ${exerciseGoal} exercises together.`;
      setGreetingMessage(fallbackGreeting);
      if (!isMuted) {
        speak(fallbackGreeting, 'encouraging');
      } else {
        setTimeout(() => loadNextExercise(), 2000);
      }
    }
  };

  // Update difficulty based on performance streaks
  const updateDifficultyAfterAnswer = useCallback((isCorrect: boolean) => {
    // Record exercise timing
    const timeSpent = Math.round((Date.now() - exerciseStartTime) / 1000);
    setExerciseTimings(prev => [...prev, {
      exerciseNumber: stats.total + 1,
      difficulty: currentDifficulty,
      timeSpentSeconds: timeSpent,
      isCorrect,
    }]);
    
    setPerformanceData(prev => {
      const newPerf = {
        ...prev,
        correctStreak: isCorrect ? prev.correctStreak + 1 : 0,
        incorrectStreak: isCorrect ? 0 : prev.incorrectStreak + 1,
        accuracy: stats.total > 0 ? (stats.correct + (isCorrect ? 1 : 0)) / (stats.total + 1) : isCorrect ? 1 : 0,
        exercisesAtCurrentDifficulty: prev.exercisesAtCurrentDifficulty + 1,
      };
      
      const prevDifficulty = currentDifficulty;
      
      // Upgrade difficulty after 2 correct in a row (or 3 at current level)
      if (newPerf.correctStreak >= 2 || (newPerf.exercisesAtCurrentDifficulty >= 3 && newPerf.accuracy >= 0.7)) {
        if (currentDifficulty === 'easy') {
          setCurrentDifficulty('medium');
          setDifficultyProgressions(p => [...p, {
            fromDifficulty: 'easy',
            toDifficulty: 'medium',
            afterExercise: stats.total + 1,
          }]);
          return { ...newPerf, exercisesAtCurrentDifficulty: 0 };
        } else if (currentDifficulty === 'medium') {
          setCurrentDifficulty('hard');
          setDifficultyProgressions(p => [...p, {
            fromDifficulty: 'medium',
            toDifficulty: 'hard',
            afterExercise: stats.total + 1,
          }]);
          return { ...newPerf, exercisesAtCurrentDifficulty: 0 };
        }
      }
      
      // Downgrade difficulty after 2 incorrect in a row
      if (newPerf.incorrectStreak >= 2) {
        if (currentDifficulty === 'hard') {
          setCurrentDifficulty('medium');
          setDifficultyProgressions(p => [...p, {
            fromDifficulty: 'hard',
            toDifficulty: 'medium',
            afterExercise: stats.total + 1,
          }]);
          return { ...newPerf, exercisesAtCurrentDifficulty: 0, incorrectStreak: 0 };
        } else if (currentDifficulty === 'medium') {
          setCurrentDifficulty('easy');
          setDifficultyProgressions(p => [...p, {
            fromDifficulty: 'medium',
            toDifficulty: 'easy',
            afterExercise: stats.total + 1,
          }]);
          return { ...newPerf, exercisesAtCurrentDifficulty: 0, incorrectStreak: 0 };
        }
      }
      
      return newPerf;
    });
  }, [currentDifficulty, stats, exerciseStartTime]);

  const loadNextExercise = async () => {
    if (stats.total >= exerciseGoal) {
      generateWrapUp();
      return;
    }

    setPhase('exercise');
    setAnswer('');
    setCurrentFeedback(null);
    setTutorMood('idle');
    setExerciseStartTime(Date.now()); // Reset timer for new exercise

    try {
      // Use the tracked difficulty level
      const difficulty = currentDifficulty;
      
      // Query for exercises, excluding already used ones
      let query = supabase
        .from('exercises_public')
        .select('*')
        .eq('subtopic_id', subtopicId)
        .eq('difficulty', difficulty);
      
      // Exclude used exercises
      if (usedExerciseIds.length > 0) {
        query = query.not('id', 'in', `(${usedExerciseIds.join(',')})`);
      }
      
      const { data: exercises } = await query.limit(10);

      // Filter out any null IDs and already used (double check)
      const availableExercises = exercises?.filter(
        ex => ex.id && !usedExerciseIds.includes(ex.id)
      ) || [];

      if (availableExercises.length > 0) {
        const randomExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
        
        // Track this exercise as used
        setUsedExerciseIds(prev => [...prev, randomExercise.id!]);
        setCurrentExercise(randomExercise as Exercise);
        
        // Update exercise context for the AI tutor
        exerciseContext?.setCurrentExercise({
          question: randomExercise.question || '',
          subtopicName,
          subtopicId,
          difficulty: randomExercise.difficulty as 'easy' | 'medium' | 'hard',
          hints: randomExercise.hints || [],
        });
        
        // Announce exercise
        if (!isMuted) {
          const intro = stats.total === 0 
            ? 'Here is your first exercise.' 
            : `Good, here is exercise ${stats.total + 1}.`;
          speak(intro, 'explaining');
        }
      } else {
        // No available exercises at current difficulty - generate a new one
        // Pass existing exercise IDs to avoid similar problems
        const { data } = await supabase.functions.invoke('generate-exercise', {
          body: { 
            subtopicId, 
            difficulty, 
            userId: user?.id,
            existingExercises: usedExerciseIds,
            performanceData: {
              ...performanceData,
              sessionStats: stats,
              studentMastery,
            }
          }
        });
        
        if (data && !data.error) {
          const newExercise = {
            id: data.id,
            question: data.question,
            difficulty: data.difficulty,
            hints: data.hints,
          };
          
          // Track this new exercise as used
          if (data.id) {
            setUsedExerciseIds(prev => [...prev, data.id]);
          }
          setCurrentExercise(newExercise);
          
          // Update exercise context for the AI tutor
          exerciseContext?.setCurrentExercise({
            question: data.question,
            subtopicName,
            subtopicId,
            difficulty: data.difficulty,
            hints: data.hints || [],
          });
          
          // Announce exercise
          if (!isMuted) {
            const intro = stats.total === 0 
              ? 'Here is your first exercise.' 
              : `Good, here is exercise ${stats.total + 1}.`;
            speak(intro, 'explaining');
          }
        }
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!answer.trim() || !currentExercise || !user) return;

    setIsSubmitting(true);
    setTutorMood('thinking');
    
    // Update exercise context with the student's answer
    exerciseContext?.setStudentAnswer(answer);
    exerciseContext?.incrementAttempts();

    try {
      const { data, error } = await supabase.functions.invoke('check-exercise-answer', {
        body: {
          exerciseId: currentExercise.id,
          userAnswer: answer,
          userId: user.id,
          subtopicName,
        },
      });

      if (error) throw error;

      const { isCorrect, correctAnswer, tutorFeedback } = data;
      
      setLastCorrectAnswer(correctAnswer);
      
      // Update exercise context with the correct answer
      if (correctAnswer) {
        exerciseContext?.setCorrectAnswer(correctAnswer);
      }
      
      // Update progressive difficulty based on answer
      updateDifficultyAfterAnswer(isCorrect);
      
      setStats(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        xpEarned: prev.xpEarned + (isCorrect ? 10 : 0),
      }));

      setPhase('feedback');

      if (isCorrect) {
        setTutorMood('celebrating');
        const celebrationMessages = [
          'Excellent! Completely correct!',
          'Perfect! You totally get it!',
          'Great job!',
          'Exactly right! Nice work!',
        ];
        const message = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
        setCurrentFeedback({ isCorrect: true, message });
        exerciseContext?.setLastFeedback(message);
        
        if (!isMuted) {
          speak(message, 'celebrating');
        }
      } else {
        setTutorMood('encouraging');
        setCurrentFeedback({ 
          isCorrect: false, 
          message: "That's not quite right, but don't worry.",
          tutorFeedback 
        });
        
        if (!isMuted) {
          speak("That's not quite right. Let's see what happened.", 'correcting');
        }
      }
    } catch (error) {
      console.error('Error checking answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    stopSpeaking();
    loadNextExercise();
  };

  // Save session analytics to database
  const saveSessionAnalytics = useCallback(async () => {
    if (!user) return;
    
    const durationMinutes = Math.round((Date.now() - sessionStartTime) / 60000);
    const avgTime = exerciseTimings.length > 0 
      ? Math.round(exerciseTimings.reduce((sum, t) => sum + t.timeSpentSeconds, 0) / exerciseTimings.length)
      : 0;
    
    // Determine starting difficulty (first exercise's difficulty or from student mastery)
    const startingDiff = difficultyProgressions.length > 0 
      ? difficultyProgressions[0].fromDifficulty 
      : (studentMastery >= 61 ? 'hard' : studentMastery >= 31 ? 'medium' : 'easy');
    
    try {
      // Use type assertion to handle new columns not yet in generated types
      const insertData = {
        user_id: user.id,
        session_goal: `Practice: ${subtopicName}`,
        started_at: new Date(sessionStartTime).toISOString(),
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
        problems_solved: stats.total,
        correct_answers: stats.correct,
        total_attempts: stats.total,
        xp_earned: stats.xpEarned,
        topics_covered: [subtopicName],
        difficulty_progression: difficultyProgressions,
        exercise_timings: exerciseTimings,
        starting_difficulty: startingDiff,
        final_difficulty: currentDifficulty,
        average_time_per_exercise: avgTime,
      };
      
      const { error } = await supabase
        .from('learning_sessions')
        .insert(insertData as any);
      
      if (error) {
        console.error('Error saving session analytics:', error);
      }
    } catch (err) {
      console.error('Failed to save session analytics:', err);
    }
  }, [user, sessionStartTime, exerciseTimings, difficultyProgressions, stats, subtopicName, currentDifficulty, studentMastery]);

  const generateWrapUp = async () => {
    setPhase('wrap-up');
    setTutorMood('explaining');
    
    // Save analytics to database
    await saveSessionAnalytics();

    try {
      const { data } = await supabase.functions.invoke('generate-session-wrapup', {
        body: { 
          subtopicName, 
          correct: stats.correct,
          total: stats.total,
          xpEarned: stats.xpEarned,
        },
      });

      const wrapUp = data?.wrapUp || `Great job! You got ${stats.correct} out of ${stats.total} exercises correct. You earned ${stats.xpEarned} XP. See you next time!`;
      setWrapUpMessage(wrapUp);

      if (!isMuted) {
        speak(wrapUp, 'celebrating');
      } else {
        setTimeout(() => setPhase('completed'), 3000);
      }
    } catch (error) {
      const fallback = `Great job! You got ${stats.correct} out of ${stats.total} exercises correct. See you next time!`;
      setWrapUpMessage(fallback);
      if (!isMuted) {
        speak(fallback, 'celebrating');
      }
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-500 ${
      focusMode 
        ? 'bg-focus-overlay' 
        : 'bg-gradient-warm'
    }`}>
      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>

      {/* Header - Hidden in focus mode during exercises */}
      <AnimatePresence>
        {(!focusMode || phase !== 'exercise') && (
          <motion.header 
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-4 border-b border-border/30"
          >
            <Button variant="ghost" size="sm" onClick={onEndSession} className="gap-2">
              <Home className="w-4 h-4" />
              Back
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{subtopicName}</p>
              <p className="text-xs text-muted-foreground/70">
                Exercise {Math.min(stats.total + 1, exerciseGoal)} of {exerciseGoal}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setFocusMode(!focusMode)}
                className={focusMode ? 'text-primary' : ''}
                title={focusMode ? 'Focus mode off' : 'Focus mode on'}
              >
                {focusMode ? <Eye className="w-4 h-4" /> : <Focus className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Focus Mode Mini Controls - Shown during exercises in focus mode */}
      <AnimatePresence>
        {focusMode && phase === 'exercise' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 flex items-center gap-2 z-10"
          >
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setFocusMode(false)}
              className="bg-card/50 backdrop-blur-sm"
              title="Focus mode off"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress - Minimal in focus mode */}
      <div className={`px-4 pt-4 transition-opacity duration-300 ${focusMode ? 'opacity-30' : ''}`}>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(stats.total / exerciseGoal) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* Greeting Phase */}
          {phase === 'greeting' && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <ElevenLabsAgent size="lg" />
              <div className="p-6 rounded-2xl bg-card/50 border border-border/30 max-w-md">
                <p className="text-lg leading-relaxed">{greetingMessage || 'Welcome! We will start shortly...'}</p>
              </div>
              {isMuted && (
                <Button onClick={() => loadNextExercise()} className="gap-2">
                  Start
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </motion.div>
          )}

          {/* Exercise Phase */}
          {phase === 'exercise' && currentExercise && (
            <motion.div
              key="exercise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8"
            >
              <div className="flex justify-center">
                <ElevenLabsAgent size="md" />
              </div>

              {/* Difficulty Badge */}
              <div className="flex justify-center">
                <Badge 
                  variant={
                    currentDifficulty === 'easy' ? 'secondary' : 
                    currentDifficulty === 'medium' ? 'default' : 
                    'destructive'
                  }
                  className="gap-1.5 px-3 py-1"
                >
                  <Zap className="w-3 h-3" />
                  {currentDifficulty === 'easy' && 'Easy'}
                  {currentDifficulty === 'medium' && 'Medium'}
                  {currentDifficulty === 'hard' && 'Hard'}
                </Badge>
              </div>

              {/* Question Card */}
              <div className="p-8 rounded-3xl bg-card/60 border border-border/30 shadow-soft">
                <div className="text-center text-2xl md:text-3xl leading-relaxed">
                  <MathRenderer latex={currentExercise.question} displayMode />
                </div>
              </div>

              {/* Answer Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className="flex-1 h-14 text-lg bg-card/50 border-border/30 rounded-2xl"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={!answer.trim() || isSubmitting}
                    className="h-14 px-6 rounded-2xl"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-4">
                  {currentExercise.hints && currentExercise.hints.length > 0 && (
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => {
                        if (!isMuted) {
                          speak(currentExercise.hints![0], 'thinking');
                        }
                      }}
                    >
                      <Lightbulb className="w-4 h-4 inline mr-2" />
                      Hint
                    </button>
                  )}
                  <TalkToTutorButton variant="secondary" size="sm" />
                </div>
              </form>
            </motion.div>
          )}

          {/* Feedback Phase */}
          {phase === 'feedback' && currentFeedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full space-y-6"
            >
              <div className="flex justify-center">
                <ElevenLabsAgent size="lg" />
              </div>

              <div className={`p-6 rounded-3xl border-2 ${
                currentFeedback.isCorrect 
                  ? 'bg-secondary/10 border-secondary/30' 
                  : 'bg-primary/10 border-primary/30'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {currentFeedback.isCorrect ? (
                    <CheckCircle2 className="w-8 h-8 text-secondary" />
                  ) : (
                    <XCircle className="w-8 h-8 text-primary" />
                  )}
                  <span className="text-xl font-semibold">
                    {currentFeedback.isCorrect ? 'Well done!' : 'Not quite'}
                  </span>
                </div>
                <p className="text-muted-foreground">{currentFeedback.message}</p>
                
                {!currentFeedback.isCorrect && currentFeedback.tutorFeedback && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 rounded-xl bg-background/50">
                      <p className="text-sm">
                        <strong>Tip:</strong> {currentFeedback.tutorFeedback.what_to_focus_on_next}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!currentFeedback.isCorrect && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowWalkthrough(true)}
                    className="flex-1 gap-2 h-12 rounded-2xl"
                  >
                    <PlayCircle className="w-4 h-4" />
                    View Solution
                  </Button>
                )}
                <Button 
                  onClick={handleContinue}
                  className={`gap-2 h-12 rounded-2xl ${currentFeedback.isCorrect ? 'flex-1' : ''}`}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Wrap-up Phase */}
          {(phase === 'wrap-up' || phase === 'completed') && (
            <motion.div
              key="wrapup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6 w-full max-w-lg"
            >
              <ElevenLabsAgent size="lg" />
              
              <div className="p-6 rounded-3xl bg-card/60 border border-border/30 space-y-6">
                <h2 className="text-2xl font-semibold">Session completed!</h2>
                
                {/* Main Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-secondary/10">
                    <p className="text-2xl font-bold text-secondary">{stats.correct}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/30">
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-accent/10">
                    <p className="text-2xl font-bold text-accent">{stats.xpEarned}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>

                {/* Time Analytics */}
                {exerciseTimings.length > 0 && (
                  <div className="p-4 rounded-2xl bg-muted/20 space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                      <Timer className="w-4 h-4 text-primary" />
                      <span>Time per exercise</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {exerciseTimings.map((timing, idx) => (
                        <div 
                          key={idx} 
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            timing.isCorrect 
                              ? 'bg-secondary/20 text-secondary' 
                              : 'bg-primary/20 text-primary'
                          }`}
                        >
                          #{timing.exerciseNumber}: {timing.timeSpentSeconds}s
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average: {Math.round(exerciseTimings.reduce((sum, t) => sum + t.timeSpentSeconds, 0) / exerciseTimings.length)}s per exercise
                    </p>
                  </div>
                )}

                {/* Difficulty Progression */}
                {difficultyProgressions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-muted/20 space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 text-secondary" />
                      <span>Difficulty progression</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {difficultyProgressions.map((prog, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs">
                          <Badge variant="outline" className="text-xs px-1.5">
                            {prog.fromDifficulty === 'easy' ? 'Easy' : prog.fromDifficulty === 'medium' ? 'Medium' : 'Hard'}
                          </Badge>
                          <ArrowRight className="w-3 h-3" />
                          <Badge 
                            variant={prog.toDifficulty === 'hard' ? 'destructive' : prog.toDifficulty === 'medium' ? 'default' : 'secondary'}
                            className="text-xs px-1.5"
                          >
                            {prog.toDifficulty === 'easy' ? 'Easy' : prog.toDifficulty === 'medium' ? 'Medium' : 'Hard'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Difficulty Level */}
                <div className="flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Final level:</span>
                  <Badge 
                    variant={currentDifficulty === 'hard' ? 'destructive' : currentDifficulty === 'medium' ? 'default' : 'secondary'}
                  >
                    {currentDifficulty === 'easy' ? 'Easy' : currentDifficulty === 'medium' ? 'Medium' : 'Hard'}
                  </Badge>
                </div>

                {/* Session Duration */}
                <p className="text-xs text-muted-foreground">
                  Total session time: {Math.round((Date.now() - sessionStartTime) / 60000)} minutes
                </p>

                {wrapUpMessage && (
                  <p className="text-muted-foreground leading-relaxed text-sm">{wrapUpMessage}</p>
                )}

                {phase === 'completed' && (
                  <Button onClick={onEndSession} size="lg" className="gap-2 rounded-2xl w-full">
                    <Home className="w-4 h-4" />
                    Back to overview
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Solution Walkthrough */}
      {currentExercise && (
        <SolutionWalkthrough
          isOpen={showWalkthrough}
          onClose={() => setShowWalkthrough(false)}
          question={currentExercise.question}
          subtopicName={subtopicName}
          correctAnswer={lastCorrectAnswer}
        />
      )}

      {/* Graph Calculator - Always available */}
      <ToolPanel 
        subtopicName={subtopicName} 
        suggestion={{ graph: true, calculator: true }}
      />
    </div>
  );
}
