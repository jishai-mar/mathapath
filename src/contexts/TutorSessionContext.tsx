import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type SessionPhase = 'greeting' | 'goal-setting' | 'learning' | 'wrap-up';
export type EmotionalState = 'neutral' | 'engaged' | 'struggling' | 'frustrated' | 'confident' | 'anxious';

interface SessionGoal {
  description: string;
  subtopicName?: string;
  targetSkill?: string;
}

interface SessionProgress {
  topicsCovered: string[];
  problemsSolved: number;
  hintsUsed: number;
  correctAnswers: number;
  totalAttempts: number;
}

interface TutorSessionState {
  phase: SessionPhase;
  emotionalState: EmotionalState;
  sessionGoal: SessionGoal | null;
  progress: SessionProgress;
  sessionStartTime: Date | null;
  isSessionActive: boolean;
  studentName?: string;
}

interface TutorSessionContextType extends TutorSessionState {
  startSession: (studentName?: string) => void;
  setPhase: (phase: SessionPhase) => void;
  setEmotionalState: (state: EmotionalState) => void;
  setSessionGoal: (goal: SessionGoal) => void;
  updateProgress: (update: Partial<SessionProgress>) => void;
  addTopicCovered: (topic: string) => void;
  endSession: () => void;
  resetSession: () => void;
}

const defaultProgress: SessionProgress = {
  topicsCovered: [],
  problemsSolved: 0,
  hintsUsed: 0,
  correctAnswers: 0,
  totalAttempts: 0,
};

const defaultState: TutorSessionState = {
  phase: 'greeting',
  emotionalState: 'neutral',
  sessionGoal: null,
  progress: defaultProgress,
  sessionStartTime: null,
  isSessionActive: false,
  studentName: undefined,
};

const TutorSessionContext = createContext<TutorSessionContextType | undefined>(undefined);

export function TutorSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TutorSessionState>(defaultState);

  const startSession = useCallback((studentName?: string) => {
    setState({
      ...defaultState,
      phase: 'greeting',
      sessionStartTime: new Date(),
      isSessionActive: true,
      studentName,
    });
  }, []);

  const setPhase = useCallback((phase: SessionPhase) => {
    setState(prev => ({ ...prev, phase }));
  }, []);

  const setEmotionalState = useCallback((emotionalState: EmotionalState) => {
    setState(prev => ({ ...prev, emotionalState }));
  }, []);

  const setSessionGoal = useCallback((sessionGoal: SessionGoal) => {
    setState(prev => ({ ...prev, sessionGoal }));
  }, []);

  const updateProgress = useCallback((update: Partial<SessionProgress>) => {
    setState(prev => ({
      ...prev,
      progress: { ...prev.progress, ...update },
    }));
  }, []);

  const addTopicCovered = useCallback((topic: string) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        topicsCovered: prev.progress.topicsCovered.includes(topic)
          ? prev.progress.topicsCovered
          : [...prev.progress.topicsCovered, topic],
      },
    }));
  }, []);

  const endSession = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'wrap-up' }));
  }, []);

  const resetSession = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <TutorSessionContext.Provider
      value={{
        ...state,
        startSession,
        setPhase,
        setEmotionalState,
        setSessionGoal,
        updateProgress,
        addTopicCovered,
        endSession,
        resetSession,
      }}
    >
      {children}
    </TutorSessionContext.Provider>
  );
}

export function useTutorSession() {
  const context = useContext(TutorSessionContext);
  if (context === undefined) {
    throw new Error('useTutorSession must be used within a TutorSessionProvider');
  }
  return context;
}
