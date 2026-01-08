import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface CurrentQuestion {
  id: string;
  content: string;
  parts?: { label: string; content: string }[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface UserAnswers {
  [partLabel: string]: string;
}

export interface UserProgress {
  completedParts: string[];
  correctParts: string[];
  incorrectParts: string[];
}

export interface AppContextState {
  currentScreen: string;
  selectedTopic?: { id: string; name: string };
  selectedLesson?: { id: string; name: string; index: number };
  selectedDifficulty?: 'easy' | 'medium' | 'hard';
  currentQuestion?: CurrentQuestion;
  userAnswers: UserAnswers;
  userProgress: UserProgress;
  additionalContext?: string;
}

interface AppContextType {
  state: AppContextState;
  setCurrentScreen: (screen: string) => void;
  setSelectedTopic: (topic: { id: string; name: string } | undefined) => void;
  setSelectedLesson: (lesson: { id: string; name: string; index: number } | undefined) => void;
  setSelectedDifficulty: (difficulty: 'easy' | 'medium' | 'hard' | undefined) => void;
  setCurrentQuestion: (question: CurrentQuestion | undefined) => void;
  setUserAnswers: (answers: UserAnswers) => void;
  updateUserAnswer: (partLabel: string, answer: string) => void;
  setUserProgress: (progress: UserProgress) => void;
  setAdditionalContext: (context: string | undefined) => void;
  clearContext: () => void;
  getContextSummary: () => string;
}

const defaultState: AppContextState = {
  currentScreen: 'Dashboard',
  userAnswers: {},
  userProgress: {
    completedParts: [],
    correctParts: [],
    incorrectParts: [],
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppContextState>(defaultState);

  const setCurrentScreen = useCallback((screen: string) => {
    setState(prev => ({ ...prev, currentScreen: screen }));
  }, []);

  const setSelectedTopic = useCallback((topic: { id: string; name: string } | undefined) => {
    setState(prev => ({ ...prev, selectedTopic: topic }));
  }, []);

  const setSelectedLesson = useCallback((lesson: { id: string; name: string; index: number } | undefined) => {
    setState(prev => ({ ...prev, selectedLesson: lesson }));
  }, []);

  const setSelectedDifficulty = useCallback((difficulty: 'easy' | 'medium' | 'hard' | undefined) => {
    setState(prev => ({ ...prev, selectedDifficulty: difficulty }));
  }, []);

  const setCurrentQuestion = useCallback((question: CurrentQuestion | undefined) => {
    setState(prev => ({ ...prev, currentQuestion: question }));
  }, []);

  const setUserAnswers = useCallback((answers: UserAnswers) => {
    setState(prev => ({ ...prev, userAnswers: answers }));
  }, []);

  const updateUserAnswer = useCallback((partLabel: string, answer: string) => {
    setState(prev => ({
      ...prev,
      userAnswers: { ...prev.userAnswers, [partLabel]: answer },
    }));
  }, []);

  const setUserProgress = useCallback((progress: UserProgress) => {
    setState(prev => ({ ...prev, userProgress: progress }));
  }, []);

  const setAdditionalContext = useCallback((context: string | undefined) => {
    setState(prev => ({ ...prev, additionalContext: context }));
  }, []);

  const clearContext = useCallback(() => {
    setState(defaultState);
  }, []);

  const getContextSummary = useCallback(() => {
    const parts: string[] = [];
    
    parts.push(`Current Screen: ${state.currentScreen}`);
    
    if (state.selectedTopic) {
      parts.push(`Topic: ${state.selectedTopic.name}`);
    }
    
    if (state.selectedLesson) {
      parts.push(`Lesson: ${state.selectedLesson.name} (Step ${state.selectedLesson.index + 1})`);
    }
    
    if (state.selectedDifficulty) {
      parts.push(`Difficulty: ${state.selectedDifficulty}`);
    }
    
    if (state.currentQuestion) {
      parts.push(`\nCurrent Question:`);
      parts.push(state.currentQuestion.content);
      
      if (state.currentQuestion.parts && state.currentQuestion.parts.length > 0) {
        parts.push(`\nQuestion Parts:`);
        state.currentQuestion.parts.forEach(part => {
          parts.push(`${part.label}: ${part.content}`);
        });
      }
    }
    
    if (Object.keys(state.userAnswers).length > 0) {
      parts.push(`\nUser's Current Answers:`);
      Object.entries(state.userAnswers).forEach(([label, answer]) => {
        if (answer.trim()) {
          parts.push(`${label}: "${answer}"`);
        }
      });
    }
    
    if (state.userProgress.completedParts.length > 0 || 
        state.userProgress.correctParts.length > 0 || 
        state.userProgress.incorrectParts.length > 0) {
      parts.push(`\nProgress:`);
      if (state.userProgress.correctParts.length > 0) {
        parts.push(`Correct: ${state.userProgress.correctParts.join(', ')}`);
      }
      if (state.userProgress.incorrectParts.length > 0) {
        parts.push(`Incorrect: ${state.userProgress.incorrectParts.join(', ')}`);
      }
    }
    
    if (state.additionalContext) {
      parts.push(`\nAdditional Context: ${state.additionalContext}`);
    }
    
    return parts.join('\n');
  }, [state]);

  return (
    <AppContext.Provider
      value={{
        state,
        setCurrentScreen,
        setSelectedTopic,
        setSelectedLesson,
        setSelectedDifficulty,
        setCurrentQuestion,
        setUserAnswers,
        updateUserAnswer,
        setUserProgress,
        setAdditionalContext,
        clearContext,
        getContextSummary,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
