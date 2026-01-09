import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/hooks/useAuthenticatedFetch';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'thinking';

interface UseVoiceSessionOptions {
  onTranscription?: (text: string) => void;
  autoSpeak?: boolean;
}

export function useVoiceSession({ onTranscription, autoSpeak = true }: UseVoiceSessionOptions = {}) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [lastTranscription, setLastTranscription] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average / 255);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  }, []);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      streamRef.current = stream;
      startAudioLevelMonitoring(stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopAudioLevelMonitoring();
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size > 0) {
          await processAudio(audioBlob);
        }
      };

      mediaRecorder.start();
      setVoiceState('listening');
      setIsConnected(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
      setVoiceState('idle');
    }
  }, [startAudioLevelMonitoring, stopAudioLevelMonitoring]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && voiceState === 'listening') {
      mediaRecorderRef.current.stop();
      setVoiceState('processing');
    }
  }, [voiceState]);

  const processAudio = async (audioBlob: Blob) => {
    setVoiceState('processing');
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      const response = await authenticatedFetch('tutor-stt', {
        method: 'POST',
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      if (data.text) {
        setLastTranscription(data.text);
        onTranscription?.(data.text);
      }
      
      setVoiceState('thinking');
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Could not process your voice. Please try again.');
      setVoiceState('idle');
    }
  };

  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!text || !autoSpeak) {
      setVoiceState('idle');
      return;
    }

    // Clean text for speech
    const cleanText = text
      .replace(/\$\$?[^$]+\$\$?/g, '')
      .replace(/\[GRAPH:[^\]]+\]/gi, '')
      .replace(/\[CALCULATE:[^\]]+\]/gi, '')
      .replace(/\[GEOMETRY:[^\]]+\]/gi, '')
      .replace(/\[DIAGRAM:[^\]]+\]/gi, '')
      .replace(/\[NUMBER-LINE:[^\]]+\]/gi, '')
      .replace(/\[FORMULA-TABLE:[^\]]+\]/gi, '')
      .replace(/[#*_`]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) {
      setVoiceState('idle');
      return;
    }

    setVoiceState('speaking');
    try {
      const response = await authenticatedFetch('tutor-tts', {
        method: 'POST',
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setVoiceState('idle');
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = () => {
          setVoiceState('idle');
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.play().catch(() => {
          setVoiceState('idle');
          resolve();
        });
      });
    } catch (error) {
      console.error('Error speaking:', error);
      setVoiceState('idle');
    }
  }, [autoSpeak]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setVoiceState('idle');
    }
  }, []);

  const disconnect = useCallback(() => {
    stopSpeaking();
    stopAudioLevelMonitoring();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsConnected(false);
    setVoiceState('idle');
  }, [stopSpeaking, stopAudioLevelMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    voiceState,
    setVoiceState,
    isConnected,
    lastTranscription,
    audioLevel,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    disconnect,
  };
}
