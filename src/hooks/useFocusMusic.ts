import { useState, useCallback, useRef, useEffect } from 'react';
import { authenticatedFetch } from '@/hooks/useAuthenticatedFetch';

export type MusicType = 'calm' | 'lofi' | 'classical' | 'nature' | 'focus';

interface UseFocusMusicOptions {
  defaultVolume?: number;
  fadeOnTutorSpeak?: boolean;
}

export function useFocusMusic(options: UseFocusMusicOptions = {}) {
  const { defaultVolume = 0.3, fadeOnTutorSpeak = true } = options;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(defaultVolume);
  const [currentType, setCurrentType] = useState<MusicType>('calm');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const originalVolumeRef = useRef(defaultVolume);

  const generateMusic = useCallback(async (type: MusicType): Promise<string | null> => {
    try {
      setIsLoading(true);
      
      const response = await authenticatedFetch('tutor-music', {
        method: 'POST',
        body: JSON.stringify({ type, duration: 60 }), // Generate 60 seconds
      });

      if (!response.ok) {
        throw new Error(`Music request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Error generating music:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const play = useCallback(async (type: MusicType = currentType) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audioUrl = await generateMusic(type);
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audio.loop = true; // Loop the music
    audioRef.current = audio;
    
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      console.error('Music playback error');
    };

    await audio.play();
    setCurrentType(type);
  }, [currentType, generateMusic, volume]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    originalVolumeRef.current = clampedVolume;
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Fade volume for when tutor is speaking
  const fadeToVolume = useCallback((targetVolume: number, duration: number = 500) => {
    if (!audioRef.current) return;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const startVolume = audioRef.current.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = (targetVolume - startVolume) / steps;
    let currentStep = 0;

    fadeIntervalRef.current = window.setInterval(() => {
      currentStep++;
      if (audioRef.current) {
        audioRef.current.volume = Math.max(0, Math.min(1, startVolume + (volumeStep * currentStep)));
      }
      
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      }
    }, stepDuration);
  }, []);

  // Fade out when tutor speaks
  const fadeOutForSpeech = useCallback(() => {
    if (fadeOnTutorSpeak && isPlaying) {
      fadeToVolume(volume * 0.2, 300);
    }
  }, [fadeOnTutorSpeak, fadeToVolume, isPlaying, volume]);

  // Fade back in when tutor stops speaking
  const fadeInAfterSpeech = useCallback(() => {
    if (fadeOnTutorSpeak && isPlaying) {
      fadeToVolume(originalVolumeRef.current, 500);
    }
  }, [fadeOnTutorSpeak, fadeToVolume, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  return {
    play,
    pause,
    resume,
    stop,
    setVolume,
    fadeOutForSpeech,
    fadeInAfterSpeech,
    isPlaying,
    isLoading,
    volume,
    currentType,
  };
}
