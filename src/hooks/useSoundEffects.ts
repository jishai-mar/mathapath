import { useCallback, useRef, useState } from 'react';
import { authenticatedFetch } from '@/hooks/useAuthenticatedFetch';

export type SoundEffectType = 
  | 'correct' 
  | 'incorrect' 
  | 'achievement' 
  | 'levelUp' 
  | 'hint' 
  | 'newExercise' 
  | 'xpGain' 
  | 'streak';

interface UseSoundEffectsOptions {
  enabled?: boolean;
  volume?: number;
}

// Cache for generated sound effects
const sfxCache = new Map<SoundEffectType, string>();

export function useSoundEffects(options: UseSoundEffectsOptions = {}) {
  const { enabled = true, volume = 0.5 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(async (type: SoundEffectType): Promise<void> => {
    if (!enabled) return;

    try {
      // Check cache first
      let audioUrl = sfxCache.get(type);

      if (!audioUrl) {
        setIsLoading(true);
        
        const response = await authenticatedFetch('tutor-sfx', {
          method: 'POST',
          body: JSON.stringify({ type }),
        });

        if (!response.ok) {
          throw new Error(`SFX request failed: ${response.status}`);
        }

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        
        // Cache for future use
        sfxCache.set(type, audioUrl);
        setIsLoading(false);
      }

      // Stop any currently playing sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error('Error playing sound effect:', error);
      setIsLoading(false);
    }
  }, [enabled, volume]);

  const playCorrect = useCallback(() => playSound('correct'), [playSound]);
  const playIncorrect = useCallback(() => playSound('incorrect'), [playSound]);
  const playAchievement = useCallback(() => playSound('achievement'), [playSound]);
  const playLevelUp = useCallback(() => playSound('levelUp'), [playSound]);
  const playHint = useCallback(() => playSound('hint'), [playSound]);
  const playNewExercise = useCallback(() => playSound('newExercise'), [playSound]);
  const playXpGain = useCallback(() => playSound('xpGain'), [playSound]);
  const playStreak = useCallback(() => playSound('streak'), [playSound]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Preload common sounds
  const preload = useCallback(async (types: SoundEffectType[]) => {
    for (const type of types) {
      if (!sfxCache.has(type)) {
        try {
          const response = await authenticatedFetch('tutor-sfx', {
            method: 'POST',
            body: JSON.stringify({ type }),
          });

          if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            sfxCache.set(type, audioUrl);
          }
        } catch (error) {
          console.error(`Error preloading ${type}:`, error);
        }
      }
    }
  }, []);

  return {
    playSound,
    playCorrect,
    playIncorrect,
    playAchievement,
    playLevelUp,
    playHint,
    playNewExercise,
    playXpGain,
    playStreak,
    stop,
    preload,
    isLoading,
  };
}
