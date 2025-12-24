import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface ExerciseContextData {
  // Current exercise information
  currentQuestion: string | null;
  currentAnswer: string | null;
  correctAnswer: string | null;
  subtopicName: string | null;
  subtopicId: string | null;
  topicName: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  hints: string[] | null;
  
  // Student state
  studentAttempts: number;
  isWaitingForAnswer: boolean;
  lastFeedback: string | null;
  
  // Conversation history for context
  tutorConversation: Array<{ role: 'student' | 'tutor'; message: string; timestamp: Date }>;
}

interface ExerciseContextValue extends ExerciseContextData {
  // Setters
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
  incrementAttempts: () => void;
  setIsWaitingForAnswer: (waiting: boolean) => void;
  setLastFeedback: (feedback: string) => void;
  addConversationMessage: (role: 'student' | 'tutor', message: string) => void;
  clearExercise: () => void;
  
  // Get context for AI prompt
  getContextForTutor: () => string;
}

const ExerciseContext = createContext<ExerciseContextValue | undefined>(undefined);

const initialState: ExerciseContextData = {
  currentQuestion: null,
  currentAnswer: null,
  correctAnswer: null,
  subtopicName: null,
  subtopicId: null,
  topicName: null,
  difficulty: null,
  hints: null,
  studentAttempts: 0,
  isWaitingForAnswer: false,
  lastFeedback: null,
  tutorConversation: [],
};

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ExerciseContextData>(initialState);

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
      currentQuestion: exercise.question,
      correctAnswer: exercise.correctAnswer || null,
      subtopicName: exercise.subtopicName,
      subtopicId: exercise.subtopicId || null,
      topicName: exercise.topicName || null,
      difficulty: exercise.difficulty || null,
      hints: exercise.hints || null,
      studentAttempts: 0,
      currentAnswer: null,
      lastFeedback: null,
      isWaitingForAnswer: true,
    }));
  }, []);

  const setStudentAnswer = useCallback((answer: string) => {
    setState(prev => ({ ...prev, currentAnswer: answer }));
  }, []);

  const setCorrectAnswer = useCallback((answer: string) => {
    setState(prev => ({ ...prev, correctAnswer: answer }));
  }, []);

  const incrementAttempts = useCallback(() => {
    setState(prev => ({ ...prev, studentAttempts: prev.studentAttempts + 1 }));
  }, []);

  const setIsWaitingForAnswer = useCallback((waiting: boolean) => {
    setState(prev => ({ ...prev, isWaitingForAnswer: waiting }));
  }, []);

  const setLastFeedback = useCallback((feedback: string) => {
    setState(prev => ({ ...prev, lastFeedback: feedback }));
  }, []);

  const addConversationMessage = useCallback((role: 'student' | 'tutor', message: string) => {
    setState(prev => ({
      ...prev,
      tutorConversation: [
        ...prev.tutorConversation.slice(-20), // Keep last 20 messages
        { role, message, timestamp: new Date() }
      ],
    }));
  }, []);

  const clearExercise = useCallback(() => {
    setState(initialState);
  }, []);

  const getContextForTutor = useCallback((): string => {
    const parts: string[] = [];
    
    if (state.topicName) {
      parts.push(`The student is learning: ${state.topicName}`);
    }
    
    if (state.subtopicName) {
      parts.push(`Current subtopic: ${state.subtopicName}`);
    }
    
    if (state.currentQuestion) {
      parts.push(`Current question the student is working on: "${state.currentQuestion}"`);
    }
    
    if (state.difficulty) {
      parts.push(`Difficulty level: ${state.difficulty}`);
    }
    
    if (state.currentAnswer) {
      parts.push(`Student's current/last answer attempt: "${state.currentAnswer}"`);
    }
    
    if (state.correctAnswer) {
      parts.push(`The correct answer is: "${state.correctAnswer}"`);
    }
    
    if (state.studentAttempts > 0) {
      parts.push(`Number of attempts so far: ${state.studentAttempts}`);
    }
    
    if (state.lastFeedback) {
      parts.push(`Previous feedback given: "${state.lastFeedback}"`);
    }
    
    if (state.hints && state.hints.length > 0) {
      parts.push(`Available hints: ${state.hints.join(' | ')}`);
    }
    
    if (state.tutorConversation.length > 0) {
      const recentConvo = state.tutorConversation.slice(-5);
      const convoSummary = recentConvo.map(m => `${m.role}: ${m.message}`).join('\n');
      parts.push(`Recent conversation:\n${convoSummary}`);
    }
    
    return parts.join('\n\n');
  }, [state]);

  const value: ExerciseContextValue = {
    ...state,
    setCurrentExercise,
    setStudentAnswer,
    setCorrectAnswer,
    incrementAttempts,
    setIsWaitingForAnswer,
    setLastFeedback,
    addConversationMessage,
    clearExercise,
    getContextForTutor,
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
    // Return a mock context for pages without exercise context
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
