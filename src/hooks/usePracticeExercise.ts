import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { 
  Exercise, 
  ExerciseDetails, 
  PracticeState, 
  PracticeMode 
} from '@/components/practice/types';
import { validateExercise } from '@/lib/exerciseValidator';

interface UsePracticeExerciseProps {
  subtopicId: string;
  subtopicName: string;
  topicName?: string;
  initialDifficulty?: 'easy' | 'medium' | 'hard';
}

interface UsePracticeExerciseReturn extends PracticeState {
  setStudentAnswer: (answer: string) => void;
  submitAnswer: () => Promise<void>;
  loadNextExercise: () => Promise<void>;
  revealNextStep: () => void;
  openTheory: () => void;
  closeTheory: () => void;
  openSolution: () => void;
  closeSolution: () => void;
  startWalkthrough: () => void;
  resetState: () => void;
  tutorFeedback: any;
  correctAnswer: string | undefined;
}

const COMPLIMENTS = [
  "Excellent work!",
  "Spot on!",
  "You nailed it!",
  "Perfect!",
  "Great job!",
  "Well done!",
  "Brilliant!",
  "That's correct!"
];

const ENCOURAGEMENTS = [
  "Don't worry, let's work through this together.",
  "Almost there! Let's see where things went off track.",
  "Good attempt! Let me help you understand this better.",
  "That's a common mistake. Let's figure it out.",
  "No problem! This is how we learn."
];

export function usePracticeExercise({
  subtopicId,
  subtopicName,
  topicName,
  initialDifficulty = 'easy'
}: UsePracticeExerciseProps): UsePracticeExerciseReturn {
  const { user } = useAuth();
  const exerciseContext = useExerciseContext();
  
  // Core state
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [exerciseDetails, setExerciseDetails] = useState<ExerciseDetails | null>(null);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [revealedStepCount, setRevealedStepCount] = useState(0);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [isSolutionOpen, setIsSolutionOpen] = useState(false);
  const [mode, setMode] = useState<PracticeMode>('practice');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [tutorFeedback, setTutorFeedback] = useState<any>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Progress tracking
  const [exerciseCount, setExerciseCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState(initialDifficulty);
  const [usedExercises, setUsedExercises] = useState<{ id: string; question: string }[]>([]);

  // Load exercise details when exercise changes
  useEffect(() => {
    if (currentExercise && !exerciseDetails) {
      loadExerciseDetails();
    }
  }, [currentExercise?.id]);

  // Sync current exercise with global ExerciseContext for tutor awareness
  useEffect(() => {
    if (currentExercise && exerciseContext) {
      exerciseContext.setCurrentExercise({
        question: currentExercise.question,
        subtopicName: currentExercise.subtopicName || subtopicName,
        subtopicId: currentExercise.subtopicId || subtopicId,
        topicName: topicName || 'Mathematics',
        difficulty: currentExercise.difficulty,
        hints: currentExercise.hints || []
      });
    }
  }, [currentExercise?.id, exerciseContext]);

  // Sync student answer with ExerciseContext
  useEffect(() => {
    if (exerciseContext && studentAnswer !== undefined) {
      exerciseContext.setStudentAnswer(studentAnswer);
    }
  }, [studentAnswer, exerciseContext]);
  const loadExerciseDetails = useCallback(async () => {
    if (!currentExercise) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-exercise-details', {
        body: {
          exerciseId: currentExercise.id,
          subtopicId,
          subtopicName,
          topicName,
          question: currentExercise.question,
          difficulty: currentExercise.difficulty
        }
      });

      if (error) throw error;

      setExerciseDetails(data);
    } catch (error) {
      console.error('Error loading exercise details:', error);
      // Set fallback details
      setExerciseDetails({
        theory: {
          title: subtopicName,
          explanation: "Theory content is being generated...",
          keyFormulas: [],
          miniExample: null
        },
        solutionSteps: [],
        finalAnswer: "Solution is being generated...",
        tip: "Take your time and work through step by step."
      });
    }
  }, [currentExercise, subtopicId, subtopicName, topicName]);

  const loadNextExercise = useCallback(async () => {
    setIsLoading(true);
    resetExerciseState();

    try {
      // First try to fetch an existing exercise
      let query = supabase
        .from('exercises_public')
        .select('*')
        .eq('subtopic_id', subtopicId)
        .eq('difficulty', currentDifficulty);

      const usedIds = usedExercises.map(e => e.id);
      if (usedIds.length > 0) {
        query = query.not('id', 'in', `(${usedIds.join(',')})`);
      }

      const { data: exercises } = await query.limit(10);

      const availableExercises = exercises?.filter(
        ex => ex.id && !usedIds.includes(ex.id)
      ) || [];

      // Find a valid exercise (validate and auto-fix if needed)
      let selectedExercise = null;
      for (const exercise of availableExercises) {
        const validation = validateExercise(exercise.question || '');
        if (validation.isValid) {
          selectedExercise = {
            ...exercise,
            question: validation.fixedQuestion || exercise.question,
          };
          break;
        } else {
          console.warn(`[usePracticeExercise] Skipping invalid exercise ${exercise.id}: ${validation.reason}`);
        }
      }

      if (selectedExercise) {
        setUsedExercises(prev => [...prev, { id: selectedExercise.id!, question: selectedExercise.question! }]);
        setCurrentExercise({
          id: selectedExercise.id!,
          question: selectedExercise.question!,
          correctAnswer: '', // Hidden from client
          difficulty: selectedExercise.difficulty as 'easy' | 'medium' | 'hard',
          hints: selectedExercise.hints || null,
          subtopicId,
          subtopicName
        });
        setExerciseDetails(null); // Reset to trigger reload
      } else {
        // Generate a new exercise
        const { data, error } = await supabase.functions.invoke('generate-exercise', {
          body: {
            subtopicId,
            difficulty: currentDifficulty,
            userId: user?.id,
            existingExercises: usedExercises.map(e => ({ question: e.question }))
          }
        });

        if (error) throw error;

        if (data && !data.error) {
          if (data.id && data.question) {
            setUsedExercises(prev => [...prev, { id: data.id, question: data.question }]);
          }
          setCurrentExercise({
            id: data.id,
            question: data.question,
            correctAnswer: '', // Hidden from client
            difficulty: data.difficulty,
            hints: data.hints || null,
            subtopicId,
            subtopicName
          });
          setExerciseDetails(null);
        }
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
    } finally {
      setIsLoading(false);
    }
  }, [subtopicId, subtopicName, currentDifficulty, usedExercises, user?.id]);

  const submitAnswer = useCallback(async () => {
    if (!studentAnswer.trim() || !currentExercise || !user) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('check-exercise-answer', {
        body: {
          exerciseId: currentExercise.id,
          userAnswer: studentAnswer,
          userId: user.id,
          subtopicName,
          hintsUsed: revealedStepCount
        }
      });

      if (error) throw error;

      const { isCorrect: correct, correctAnswer: answer, tutorFeedback: feedback, suggestedDifficulty } = data;

      setIsCorrect(correct);
      setCorrectAnswer(answer);
      setTutorFeedback(feedback);
      setExerciseCount(prev => prev + 1);

      if (correct) {
        setCorrectCount(prev => prev + 1);
        setFeedbackMessage(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
        
        // Update difficulty based on suggestion
        if (suggestedDifficulty) {
          setCurrentDifficulty(suggestedDifficulty);
        }
      } else {
        setFeedbackMessage(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      setFeedbackMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [studentAnswer, currentExercise, user, subtopicName, revealedStepCount]);

  const revealNextStep = useCallback(() => {
    if (exerciseDetails?.solutionSteps && revealedStepCount < exerciseDetails.solutionSteps.length) {
      setRevealedStepCount(prev => prev + 1);
    }
  }, [exerciseDetails, revealedStepCount]);

  const startWalkthrough = useCallback(() => {
    setMode('walkthrough');
    setRevealedStepCount(0);
    // Reveal first step automatically in walkthrough mode
    if (exerciseDetails?.solutionSteps && exerciseDetails.solutionSteps.length > 0) {
      setRevealedStepCount(1);
    }
  }, [exerciseDetails]);

  const resetExerciseState = useCallback(() => {
    setStudentAnswer('');
    setRevealedStepCount(0);
    setIsCorrect(null);
    setFeedbackMessage('');
    setTutorFeedback(null);
    setCorrectAnswer(undefined);
    setMode('practice');
  }, []);

  const resetState = useCallback(() => {
    resetExerciseState();
    setCurrentExercise(null);
    setExerciseDetails(null);
    setExerciseCount(0);
    setCorrectCount(0);
    setUsedExercises([]);
    setCurrentDifficulty(initialDifficulty);
    // Clear global exercise context
    exerciseContext?.clearExercise();
  }, [initialDifficulty, resetExerciseState, exerciseContext]);

  return {
    // State
    currentExercise,
    exerciseDetails,
    studentAnswer,
    revealedStepCount,
    isTheoryOpen,
    isSolutionOpen,
    mode,
    isCorrect,
    feedbackMessage,
    isLoading,
    isSubmitting,
    exerciseCount,
    correctCount,
    tutorFeedback,
    correctAnswer,
    
    // Actions
    setStudentAnswer,
    submitAnswer,
    loadNextExercise,
    revealNextStep,
    openTheory: () => setIsTheoryOpen(true),
    closeTheory: () => setIsTheoryOpen(false),
    openSolution: () => setIsSolutionOpen(true),
    closeSolution: () => setIsSolutionOpen(false),
    startWalkthrough,
    resetState
  };
}
