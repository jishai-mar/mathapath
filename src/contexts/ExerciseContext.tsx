import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Subpart structure for multi-part questions
export interface ExerciseSubpart {
  label: string;  // e.g., "a", "b", "c"
  content: string; // The subpart question text
  userAnswer: string; // User's typed answer for this part
  isCorrect: boolean | null; // null = not checked yet
  correctAnswer?: string; // Revealed after checking
}

export interface ExerciseContextData {
  // Screen & navigation context
  currentScreen: string;
  
  // Topic/Lesson context
  topicId: string | null;
  topicName: string | null;
  lessonId: string | null;
  lessonName: string | null;
  lessonIndex: number | null;
  
  // Exercise context
  exerciseId: string | null;
  questionText: string | null; // FULL question text
  difficulty: 'easy' | 'medium' | 'hard' | null;
  
  // Subparts (for multi-part questions a, b, c, d, e)
  subparts: ExerciseSubpart[];
  activeSubpartIndex: number; // Which subpart is currently focused
  
  // Overall progress
  progressState: 'not_started' | 'in_progress' | 'completed';
  totalAttempts: number;
  hintsUsed: number;
  availableHints: string[];
  
  // Feedback
  lastFeedback: string | null;
  
  // Conversation history for AI context
  tutorConversation: Array<{ role: 'student' | 'tutor'; message: string; timestamp: Date }>;
}

// Backward compatible aliases for existing code
interface BackwardCompatibleFields {
  // Legacy field names (aliased from new structure)
  currentQuestion: string | null;
  currentAnswer: string | null;
  correctAnswer: string | null;
  subtopicName: string | null;
  subtopicId: string | null;
  studentAttempts: number;
  isWaitingForAnswer: boolean;
  hints: string[] | null;
}

interface ExerciseContextValue extends ExerciseContextData, BackwardCompatibleFields {
  // Set full exercise with all subparts
  setFullExercise: (exercise: {
    exerciseId: string;
    questionText: string;
    subparts: Array<{ label: string; content: string; correctAnswer?: string }>;
    topicId?: string;
    topicName?: string;
    lessonId?: string;
    lessonName?: string;
    lessonIndex?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    hints?: string[];
  }) => void;
  
  // Update screen context
  setCurrentScreen: (screen: string) => void;
  
  // Update topic/lesson context without clearing exercise
  setLessonContext: (context: {
    topicId?: string;
    topicName?: string;
    lessonId?: string;
    lessonName?: string;
    lessonIndex?: number;
  }) => void;
  
  // Update user answer for a specific subpart
  updateSubpartAnswer: (label: string, answer: string) => void;
  
  // Mark a subpart as checked (correct/incorrect)
  markSubpartResult: (label: string, isCorrect: boolean, correctAnswer?: string) => void;
  
  // Set active subpart (which one user is focused on)
  setActiveSubpart: (index: number) => void;
  
  // Progress and hints
  incrementAttempts: () => void;
  useHint: () => void;
  setLastFeedback: (feedback: string) => void;
  setProgressState: (state: 'not_started' | 'in_progress' | 'completed') => void;
  
  // Conversation
  addConversationMessage: (role: 'student' | 'tutor', message: string) => void;
  
  // Clear exercise (when leaving)
  clearExercise: () => void;
  
  // Get comprehensive context for AI prompt
  getFullContextForTutor: () => string;
  
  // Backward compatible - alias for getFullContextForTutor
  getContextForTutor: () => string;
  
  // Check if there's an active exercise
  hasActiveExercise: () => boolean;
  
  // Backward compatible setters
  setCurrentExercise: (exercise: {
    question: string;
    correctAnswer?: string;
    subtopicName: string;
    subtopicId?: string;
    topicName?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    hints?: string[];
  }) => void;
  setStudentAnswer: (answer: string) => void;
  setCorrectAnswer: (answer: string) => void;
  setIsWaitingForAnswer: (waiting: boolean) => void;
}

const ExerciseContext = createContext<ExerciseContextValue | undefined>(undefined);

const initialState: ExerciseContextData = {
  currentScreen: 'Dashboard',
  topicId: null,
  topicName: null,
  lessonId: null,
  lessonName: null,
  lessonIndex: null,
  exerciseId: null,
  questionText: null,
  difficulty: null,
  subparts: [],
  activeSubpartIndex: 0,
  progressState: 'not_started',
  totalAttempts: 0,
  hintsUsed: 0,
  availableHints: [],
  lastFeedback: null,
  tutorConversation: [],
};

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ExerciseContextData>(initialState);

  const setFullExercise = useCallback((exercise: {
    exerciseId: string;
    questionText: string;
    subparts: Array<{ label: string; content: string; correctAnswer?: string }>;
    topicId?: string;
    topicName?: string;
    lessonId?: string;
    lessonName?: string;
    lessonIndex?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    hints?: string[];
  }) => {
    setState(prev => ({
      ...prev,
      exerciseId: exercise.exerciseId,
      questionText: exercise.questionText,
      topicId: exercise.topicId || prev.topicId,
      topicName: exercise.topicName || prev.topicName,
      lessonId: exercise.lessonId || prev.lessonId,
      lessonName: exercise.lessonName || prev.lessonName,
      lessonIndex: exercise.lessonIndex ?? prev.lessonIndex,
      difficulty: exercise.difficulty || null,
      subparts: exercise.subparts.map(sp => ({
        label: sp.label,
        content: sp.content,
        userAnswer: '',
        isCorrect: null,
        correctAnswer: sp.correctAnswer,
      })),
      activeSubpartIndex: 0,
      progressState: 'in_progress',
      totalAttempts: 0,
      hintsUsed: 0,
      availableHints: exercise.hints || [],
      lastFeedback: null,
    }));
  }, []);

  const setCurrentScreen = useCallback((screen: string) => {
    setState(prev => ({ ...prev, currentScreen: screen }));
  }, []);

  const setLessonContext = useCallback((context: {
    topicId?: string;
    topicName?: string;
    lessonId?: string;
    lessonName?: string;
    lessonIndex?: number;
  }) => {
    setState(prev => ({
      ...prev,
      topicId: context.topicId || prev.topicId,
      topicName: context.topicName || prev.topicName,
      lessonId: context.lessonId || prev.lessonId,
      lessonName: context.lessonName || prev.lessonName,
      lessonIndex: context.lessonIndex ?? prev.lessonIndex,
    }));
  }, []);

  const updateSubpartAnswer = useCallback((label: string, answer: string) => {
    setState(prev => ({
      ...prev,
      subparts: prev.subparts.map(sp =>
        sp.label === label ? { ...sp, userAnswer: answer } : sp
      ),
    }));
  }, []);

  const markSubpartResult = useCallback((label: string, isCorrect: boolean, correctAnswer?: string) => {
    setState(prev => ({
      ...prev,
      subparts: prev.subparts.map(sp =>
        sp.label === label
          ? { ...sp, isCorrect, correctAnswer: correctAnswer || sp.correctAnswer }
          : sp
      ),
    }));
  }, []);

  const setActiveSubpart = useCallback((index: number) => {
    setState(prev => ({ ...prev, activeSubpartIndex: index }));
  }, []);

  const incrementAttempts = useCallback(() => {
    setState(prev => ({ ...prev, totalAttempts: prev.totalAttempts + 1 }));
  }, []);

  const useHint = useCallback(() => {
    setState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
  }, []);

  const setLastFeedback = useCallback((feedback: string) => {
    setState(prev => ({ ...prev, lastFeedback: feedback }));
  }, []);

  const setProgressState = useCallback((progressState: 'not_started' | 'in_progress' | 'completed') => {
    setState(prev => ({ ...prev, progressState }));
  }, []);

  const addConversationMessage = useCallback((role: 'student' | 'tutor', message: string) => {
    setState(prev => ({
      ...prev,
      tutorConversation: [
        ...prev.tutorConversation.slice(-20),
        { role, message, timestamp: new Date() }
      ],
    }));
  }, []);

  const clearExercise = useCallback(() => {
    setState(prev => ({
      ...initialState,
      currentScreen: prev.currentScreen,
      topicId: prev.topicId,
      topicName: prev.topicName,
      lessonId: prev.lessonId,
      lessonName: prev.lessonName,
      lessonIndex: prev.lessonIndex,
    }));
  }, []);

  const hasActiveExercise = useCallback((): boolean => {
    return !!state.exerciseId && !!state.questionText;
  }, [state.exerciseId, state.questionText]);

  const getFullContextForTutor = useCallback((): string => {
    const parts: string[] = [];
    
    parts.push(`=== CURRENT LEARNING CONTEXT ===`);
    parts.push(`Screen: ${state.currentScreen}`);
    
    if (state.topicName) {
      parts.push(`Topic: ${state.topicName}`);
    }
    
    if (state.lessonName) {
      parts.push(`Lesson: ${state.lessonName}${state.lessonIndex !== null ? ` (Step ${state.lessonIndex + 1})` : ''}`);
    }
    
    if (state.difficulty) {
      parts.push(`Difficulty: ${state.difficulty.toUpperCase()}`);
    }
    
    if (state.questionText) {
      parts.push(`\n=== CURRENT EXERCISE (VISIBLE ON STUDENT'S SCREEN) ===`);
      parts.push(`Full Question:\n${state.questionText}`);
      
      if (state.subparts.length > 0) {
        parts.push(`\n--- Question Parts ---`);
        state.subparts.forEach((sp, idx) => {
          const status = sp.isCorrect === null 
            ? '(not yet checked)' 
            : sp.isCorrect 
              ? '✓ CORRECT' 
              : '✗ INCORRECT';
          const activeMarker = idx === state.activeSubpartIndex ? ' [CURRENTLY FOCUSED]' : '';
          parts.push(`Part (${sp.label})${activeMarker}: ${sp.content}`);
          parts.push(`  Student's answer: "${sp.userAnswer || '(empty)'}"`);
          parts.push(`  Status: ${status}`);
          if (sp.isCorrect === false && sp.correctAnswer) {
            parts.push(`  Correct answer was: "${sp.correctAnswer}"`);
          }
        });
      }
      
      parts.push(`\n--- Progress ---`);
      parts.push(`Attempts so far: ${state.totalAttempts}`);
      parts.push(`Hints used: ${state.hintsUsed}/${state.availableHints.length}`);
      parts.push(`Status: ${state.progressState}`);
      
      const correctCount = state.subparts.filter(sp => sp.isCorrect === true).length;
      const incorrectCount = state.subparts.filter(sp => sp.isCorrect === false).length;
      const pendingCount = state.subparts.filter(sp => sp.isCorrect === null).length;
      
      if (state.subparts.length > 0) {
        parts.push(`Parts correct: ${correctCount}/${state.subparts.length}`);
        parts.push(`Parts incorrect: ${incorrectCount}/${state.subparts.length}`);
        parts.push(`Parts pending: ${pendingCount}/${state.subparts.length}`);
      }
      
      if (state.lastFeedback) {
        parts.push(`\nLast feedback given: "${state.lastFeedback}"`);
      }
      
      if (state.availableHints.length > 0 && state.hintsUsed > 0) {
        parts.push(`\nHints revealed so far:`);
        state.availableHints.slice(0, state.hintsUsed).forEach((hint, i) => {
          parts.push(`  Hint ${i + 1}: ${hint}`);
        });
      }
    } else {
      parts.push(`\n=== NO ACTIVE EXERCISE ===`);
      parts.push(`The student is not currently working on a specific problem.`);
    }
    
    if (state.tutorConversation.length > 0) {
      parts.push(`\n=== RECENT CONVERSATION ===`);
      const recent = state.tutorConversation.slice(-5);
      recent.forEach(m => {
        parts.push(`${m.role === 'student' ? 'Student' : 'Tutor'}: ${m.message}`);
      });
    }
    
    return parts.join('\n');
  }, [state]);

  // Backward compatible setters
  const setCurrentExercise = useCallback((exercise: {
    question: string;
    correctAnswer?: string;
    subtopicName: string;
    subtopicId?: string;
    topicName?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    hints?: string[];
  }) => {
    setState(prev => ({
      ...prev,
      exerciseId: exercise.subtopicId || 'legacy-exercise',
      questionText: exercise.question,
      lessonId: exercise.subtopicId || prev.lessonId,
      lessonName: exercise.subtopicName,
      topicName: exercise.topicName || prev.topicName,
      difficulty: exercise.difficulty || null,
      subparts: [{ 
        label: 'main', 
        content: exercise.question, 
        userAnswer: '', 
        isCorrect: null,
        correctAnswer: exercise.correctAnswer 
      }],
      activeSubpartIndex: 0,
      progressState: 'in_progress',
      totalAttempts: 0,
      hintsUsed: 0,
      availableHints: exercise.hints || [],
      lastFeedback: null,
    }));
  }, []);

  const setStudentAnswer = useCallback((answer: string) => {
    setState(prev => ({
      ...prev,
      subparts: prev.subparts.map((sp, idx) =>
        idx === prev.activeSubpartIndex ? { ...sp, userAnswer: answer } : sp
      ),
    }));
  }, []);

  const setCorrectAnswer = useCallback((answer: string) => {
    setState(prev => ({
      ...prev,
      subparts: prev.subparts.map((sp, idx) =>
        idx === prev.activeSubpartIndex ? { ...sp, correctAnswer: answer } : sp
      ),
    }));
  }, []);

  const setIsWaitingForAnswer = useCallback((waiting: boolean) => {
    setState(prev => ({ 
      ...prev, 
      progressState: waiting ? 'in_progress' : prev.progressState 
    }));
  }, []);

  // Computed backward-compatible fields
  const currentQuestion = state.questionText;
  const currentAnswer = state.subparts[state.activeSubpartIndex]?.userAnswer || null;
  const correctAnswer = state.subparts[state.activeSubpartIndex]?.correctAnswer || null;
  const subtopicName = state.lessonName;
  const subtopicId = state.lessonId;
  const studentAttempts = state.totalAttempts;
  const isWaitingForAnswer = state.progressState === 'in_progress';
  const hints = state.availableHints.length > 0 ? state.availableHints : null;

  const value: ExerciseContextValue = {
    ...state,
    // New methods
    setFullExercise,
    setCurrentScreen,
    setLessonContext,
    updateSubpartAnswer,
    markSubpartResult,
    setActiveSubpart,
    incrementAttempts,
    useHint,
    setLastFeedback,
    setProgressState,
    addConversationMessage,
    clearExercise,
    getFullContextForTutor,
    hasActiveExercise,
    // Backward compatible alias
    getContextForTutor: getFullContextForTutor,
    // Backward compatible setters
    setCurrentExercise,
    setStudentAnswer,
    setCorrectAnswer,
    setIsWaitingForAnswer,
    // Backward compatible computed fields
    currentQuestion,
    currentAnswer,
    correctAnswer,
    subtopicName,
    subtopicId,
    studentAttempts,
    isWaitingForAnswer,
    hints,
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExerciseContext() {
  const context = useContext(ExerciseContext);
  if (context === undefined) {
    return null;
  }
  return context;
}

export function useExerciseContextRequired() {
  const context = useContext(ExerciseContext);
  if (context === undefined) {
    throw new Error('useExerciseContextRequired must be used within an ExerciseProvider');
  }
  return context;
}
