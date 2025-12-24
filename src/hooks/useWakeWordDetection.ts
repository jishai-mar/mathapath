import { useState, useEffect, useRef, useCallback } from 'react';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

interface WindowWithSpeech {
  SpeechRecognition?: SpeechRecognitionStatic;
  webkitSpeechRecognition?: SpeechRecognitionStatic;
}

interface WakeWordOptions {
  wakeWords?: string[];
  onWakeWordDetected?: (transcript: string) => void;
  enabled?: boolean;
}

interface WakeWordState {
  isListening: boolean;
  wakeWordDetected: boolean;
  transcript: string;
  error: string | null;
}

export function useWakeWordDetection({
  wakeWords = ['gilbert', 'hey gilbert', 'hé gilbert', 'hoi gilbert'],
  onWakeWordDetected,
  enabled = true,
}: WakeWordOptions = {}) {
  const [state, setState] = useState<WakeWordState>({
    isListening: false,
    wakeWordDetected: false,
    transcript: '',
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectionRef = useRef<number>(0);
  const enabledRef = useRef(enabled);
  const onWakeWordDetectedRef = useRef(onWakeWordDetected);

  // Keep refs in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onWakeWordDetectedRef.current = onWakeWordDetected;
  }, [onWakeWordDetected]);

  // Check if Web Speech API is available
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const checkForWakeWord = useCallback((transcript: string): boolean => {
    const normalizedTranscript = transcript.toLowerCase().trim();
    return wakeWords.some(word => normalizedTranscript.includes(word.toLowerCase()));
  }, [wakeWords]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent auto-restart
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
    
    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported' }));
      return;
    }

    // Already listening
    if (recognitionRef.current) {
      return;
    }

    try {
      const windowWithSpeech = window as unknown as WindowWithSpeech;
      const SpeechRecognitionClass = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        setState(prev => ({ ...prev, error: 'Speech recognition not available' }));
        return;
      }
      const recognition = new SpeechRecognitionClass();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'nl-NL'; // Dutch for Gilbert (can be made configurable)

      recognition.onstart = () => {
        setState(prev => ({ ...prev, isListening: true, error: null }));
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
        recognitionRef.current = null;
        
        // Auto-restart if still enabled
        if (enabledRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (enabledRef.current && !recognitionRef.current) {
              startListening();
            }
          }, 500);
        }
      };

      recognition.onerror = (event) => {
        // Ignore common non-fatal errors
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        console.error('Speech recognition error:', event.error);
        setState(prev => ({ ...prev, error: event.error }));
      };

      recognition.onresult = (event: Event) => {
        const speechEvent = event as SpeechRecognitionEvent;
        let transcript = '';
        
        for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
          const result = speechEvent.results[i];
          transcript += result[0].transcript;
        }

        setState(prev => ({ ...prev, transcript }));

        // Check for wake word with debounce to prevent multiple triggers
        if (checkForWakeWord(transcript)) {
          const now = Date.now();
          // Prevent triggering more than once every 3 seconds
          if (now - lastDetectionRef.current > 3000) {
            lastDetectionRef.current = now;
            
            setState(prev => ({ ...prev, wakeWordDetected: true }));
            onWakeWordDetectedRef.current?.(transcript);
            
            // Reset wake word detection after a short delay
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
              setState(prev => ({ ...prev, wakeWordDetected: false }));
            }, 2000);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setState(prev => ({ ...prev, error: 'Failed to start speech recognition' }));
    }
  }, [isSupported, checkForWakeWord]);

  const resetDetection = useCallback(() => {
    setState(prev => ({ ...prev, wakeWordDetected: false, transcript: '' }));
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled && isSupported) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, isSupported]); // Removed function deps - use refs instead

  return {
    ...state,
    isSupported,
    startListening,
    stopListening,
    resetDetection,
  };
}
