import { useState, useCallback, useRef } from 'react';
import { useScribe, CommitStrategy } from '@elevenlabs/react';

interface UseRealtimeTranscriptionOptions {
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onError?: (error: Error) => void;
}

export function useRealtimeTranscription(options: UseRealtimeTranscriptionOptions = {}) {
  const { onPartialTranscript, onFinalTranscript, onError } = options;
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [finalText, setFinalText] = useState('');
  const committedTextsRef = useRef<string[]>([]);

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    commitStrategy: CommitStrategy.VAD, // Voice Activity Detection for automatic commit
    onPartialTranscript: (data) => {
      setPartialText(data.text);
      onPartialTranscript?.(data.text);
    },
    onCommittedTranscript: (data) => {
      committedTextsRef.current.push(data.text);
      const fullText = committedTextsRef.current.join(' ');
      setFinalText(fullText);
      setPartialText('');
      onFinalTranscript?.(data.text);
    },
  });

  const start = useCallback(async () => {
    setIsConnecting(true);
    committedTextsRef.current = [];
    setFinalText('');
    setPartialText('');

    try {
      // Get token from edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-stt-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get STT token');
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received');
      }

      // Connect with microphone
      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      console.error('Error starting realtime transcription:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsConnecting(false);
    }
  }, [scribe, onError]);

  const stop = useCallback(() => {
    scribe.disconnect();
    setPartialText('');
  }, [scribe]);

  const getFullTranscript = useCallback(() => {
    const committed = committedTextsRef.current.join(' ');
    return partialText ? `${committed} ${partialText}`.trim() : committed;
  }, [partialText]);

  const reset = useCallback(() => {
    committedTextsRef.current = [];
    setFinalText('');
    setPartialText('');
  }, []);

  return {
    start,
    stop,
    reset,
    getFullTranscript,
    isConnected: scribe.isConnected,
    isConnecting,
    partialText,
    finalText,
    committedTranscripts: scribe.committedTranscripts,
  };
}
