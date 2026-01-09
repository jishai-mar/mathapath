import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/hooks/useAuthenticatedFetch';

interface VoiceControlsProps {
  onTranscription: (text: string) => void;
  textToSpeak?: string;
  isDisabled?: boolean;
  className?: string;
}

export function VoiceControls({
  onTranscription,
  textToSpeak,
  isDisabled = false,
  className,
}: VoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size > 0) {
          await processAudio(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to base64
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

      // Send to STT endpoint
      const response = await authenticatedFetch('tutor-stt', {
        method: 'POST',
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      if (data.text) {
        onTranscription(data.text);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Could not process your voice. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = useCallback(async (text: string) => {
    if (!voiceEnabled || !text) return;

    // Strip LaTeX and markdown for cleaner speech
    const cleanText = text
      .replace(/\$\$?[^$]+\$\$?/g, '') // Remove LaTeX
      .replace(/\[GRAPH:[^\]]+\]/gi, '') // Remove graph directives
      .replace(/\[CALCULATE:[^\]]+\]/gi, '')
      .replace(/\[GEOMETRY:[^\]]+\]/gi, '')
      .replace(/\[DIAGRAM:[^\]]+\]/gi, '')
      .replace(/\[NUMBER-LINE:[^\]]+\]/gi, '')
      .replace(/\[FORMULA-TABLE:[^\]]+\]/gi, '')
      .replace(/[#*_`]/g, '') // Remove markdown
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) return;

    setIsSpeaking(true);
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
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error speaking:', error);
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  const toggleVoice = useCallback(() => {
    if (voiceEnabled && isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(prev => !prev);
  }, [voiceEnabled, isSpeaking, stopSpeaking]);

  // Auto-speak when textToSpeak changes
  const lastSpokenRef = useRef<string>('');
  if (textToSpeak && textToSpeak !== lastSpokenRef.current && voiceEnabled && !isSpeaking) {
    lastSpokenRef.current = textToSpeak;
    // Delay slightly to avoid speaking partial responses
    setTimeout(() => speakText(textToSpeak), 500);
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Microphone button */}
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          type="button"
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          className={cn(
            "relative h-10 w-10 rounded-full transition-all",
            isRecording && "animate-pulse ring-2 ring-destructive ring-offset-2"
          )}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isDisabled || isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
      </motion.div>

      {/* Voice output toggle */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full",
          !voiceEnabled && "opacity-50"
        )}
        onClick={toggleVoice}
        disabled={isDisabled}
        title={voiceEnabled ? "Mute tutor voice" : "Enable tutor voice"}
      >
        {isSpeaking ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Volume2 className="w-4 h-4 text-primary" />
          </motion.div>
        ) : voiceEnabled ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </Button>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs text-destructive font-medium"
          >
            Listening...
          </motion.span>
        )}
        {isProcessing && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs text-muted-foreground"
          >
            Processing...
          </motion.span>
        )}
        {isSpeaking && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs text-primary font-medium"
          >
            Speaking...
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
