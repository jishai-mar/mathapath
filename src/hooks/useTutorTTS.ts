import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VoiceContext = 'explaining' | 'encouraging' | 'correcting' | 'celebrating' | 'thinking' | 'default';
export type TutorPersonality = 'patient' | 'encouraging' | 'strict' | 'friendly';

interface UseTutorTTSOptions {
  personality?: TutorPersonality;
  defaultContext?: VoiceContext;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
}

interface TTSState {
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useTutorTTS(options: UseTutorTTSOptions = {}) {
  const { 
    personality = 'patient', 
    defaultContext = 'default',
    onSpeakStart,
    onSpeakEnd 
  } = options;

  const [state, setState] = useState<TTSState>({
    isSpeaking: false,
    isLoading: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    audioQueueRef.current = [];
    isProcessingQueueRef.current = false;
    setState(prev => ({ ...prev, isSpeaking: false }));
    onSpeakEnd?.();
  }, [onSpeakEnd]);

  const playAudioFromBase64 = useCallback((base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audioRef.current = audio;
      
      audio.onended = () => {
        resolve();
      };
      
      audio.onerror = (e) => {
        reject(new Error('Audio playback failed'));
      };
      
      audio.play().catch(reject);
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;
    setState(prev => ({ ...prev, isSpeaking: true }));
    onSpeakStart?.();

    while (audioQueueRef.current.length > 0) {
      const base64Audio = audioQueueRef.current.shift();
      if (base64Audio) {
        try {
          await playAudioFromBase64(base64Audio);
        } catch (error) {
          console.error('Error playing audio segment:', error);
        }
      }
    }

    isProcessingQueueRef.current = false;
    setState(prev => ({ ...prev, isSpeaking: false }));
    onSpeakEnd?.();
  }, [playAudioFromBase64, onSpeakStart, onSpeakEnd]);

  const speak = useCallback(async (
    text: string, 
    context: VoiceContext = defaultContext
  ): Promise<void> => {
    if (!text.trim()) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text,
            personality,
            context,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      // Get audio as blob and convert to base64
      const audioBlob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just the base64
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const base64Audio = await base64Promise;
      
      // Add to queue and process
      audioQueueRef.current.push(base64Audio);
      setState(prev => ({ ...prev, isLoading: false }));
      processQueue();

    } catch (error) {
      console.error('TTS error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'TTS failed' 
      }));
    }
  }, [personality, defaultContext, processQueue]);

  const speakSequence = useCallback(async (
    texts: string[],
    context: VoiceContext = defaultContext
  ): Promise<void> => {
    stopSpeaking();
    
    for (const text of texts) {
      if (text.trim()) {
        await speak(text, context);
      }
    }
  }, [speak, stopSpeaking, defaultContext]);

  return {
    speak,
    speakSequence,
    stopSpeaking,
    isSpeaking: state.isSpeaking,
    isLoading: state.isLoading,
    error: state.error,
  };
}
