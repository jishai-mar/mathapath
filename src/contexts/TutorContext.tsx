import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { AvatarStyle } from '@/components/tutor/TutorAvatar';
import { Personality, ChatTheme } from '@/components/tutor/TutorCustomizationModal';

interface TutorPreferences {
  tutorName: string;
  avatarStyle: AvatarStyle;
  personality: Personality;
  chatTheme: ChatTheme;
}

interface TutorContextType {
  preferences: TutorPreferences;
  isLoading: boolean;
  isFirstTime: boolean;
  updatePreferences: (newPreferences: Partial<TutorPreferences>) => Promise<void>;
  setFirstTimeComplete: () => void;
}

const defaultPreferences: TutorPreferences = {
  tutorName: 'Alex',
  avatarStyle: 'friendly-robot',
  personality: 'patient',
  chatTheme: 'default',
};

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export function TutorProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<TutorPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(defaultPreferences);
      setIsLoading(false);
      setIsFirstTime(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_tutor_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading tutor preferences:', error);
        setPreferences(defaultPreferences);
        setIsFirstTime(true);
      } else if (data) {
        setPreferences({
          tutorName: data.tutor_name || defaultPreferences.tutorName,
          avatarStyle: (data.avatar_style as AvatarStyle) || defaultPreferences.avatarStyle,
          personality: (data.personality as Personality) || defaultPreferences.personality,
          chatTheme: (data.chat_theme as ChatTheme) || defaultPreferences.chatTheme,
        });
        setIsFirstTime(false);
      } else {
        // No preferences found - first time user
        setPreferences(defaultPreferences);
        setIsFirstTime(true);
      }
    } catch (error) {
      console.error('Error loading tutor preferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<TutorPreferences>) => {
    if (!user) return;

    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);

    try {
      const { error } = await supabase
        .from('user_tutor_preferences')
        .upsert({
          user_id: user.id,
          tutor_name: updated.tutorName,
          avatar_style: updated.avatarStyle,
          personality: updated.personality,
          chat_theme: updated.chatTheme,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error saving tutor preferences:', error);
      }
    } catch (error) {
      console.error('Error saving tutor preferences:', error);
    }
  };

  const setFirstTimeComplete = () => {
    setIsFirstTime(false);
  };

  return (
    <TutorContext.Provider
      value={{
        preferences,
        isLoading,
        isFirstTime,
        updatePreferences,
        setFirstTimeComplete,
      }}
    >
      {children}
    </TutorContext.Provider>
  );
}

export function useTutor() {
  const context = useContext(TutorContext);
  if (context === undefined) {
    throw new Error('useTutor must be used within a TutorProvider');
  }
  return context;
}
