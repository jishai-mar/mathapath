import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TutorAvatar } from '@/components/tutor/TutorAvatar';
import MathRenderer from '@/components/MathRenderer';
import { useTutor } from '@/contexts/TutorContext';
import { useVoiceSession, VoiceState } from '@/hooks/useVoiceSession';
import { X, Mic, MicOff, Volume2, VolumeX, Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function VoiceFirstTutoring() {
  const navigate = useNavigate();
  const { preferences } = useTutor();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const responseRef = useRef('');

  const handleTranscription = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentResponse('');
    responseRef.current = '';

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-tutor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: text,
            context: {
              currentQuestion: null,
              subtopicName: 'Voice Tutoring Session',
              conversationHistory: messages.slice(-6),
            },
            tutorName: preferences.tutorName,
            personality: preferences.personality,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        responseRef.current += chunk;
        setCurrentResponse(responseRef.current);
      }

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: responseRef.current 
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentResponse('');

      // Speak the response if not muted
      if (!isMuted) {
        await speakText(responseRef.current);
      } else {
        setVoiceState('idle');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error:', error);
        setVoiceState('idle');
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, preferences, isMuted]);

  const {
    voiceState,
    setVoiceState,
    audioLevel,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    disconnect,
  } = useVoiceSession({ 
    onTranscription: handleTranscription,
    autoSpeak: !isMuted,
  });

  const handleMicClick = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'idle') {
      startListening();
    } else if (voiceState === 'speaking') {
      stopSpeaking();
    }
  }, [voiceState, startListening, stopListening, stopSpeaking]);

  const handleClose = useCallback(() => {
    disconnect();
    navigate(-1);
  }, [disconnect, navigate]);

  const getTutorMood = () => {
    switch (voiceState) {
      case 'listening': return 'curious';
      case 'processing': return 'thinking';
      case 'thinking': return 'thinking';
      case 'speaking': return 'explaining';
      default: return 'idle';
    }
  };

  const getStatusText = () => {
    switch (voiceState) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'thinking': return `${preferences.tutorName} is thinking...`;
      case 'speaking': return `${preferences.tutorName} is speaking...`;
      default: return `Tap to talk to ${preferences.tutorName}`;
    }
  };

  // Get the latest message to display
  const displayContent = currentResponse || messages[messages.length - 1]?.content || '';
  const isUserMessage = !currentResponse && messages[messages.length - 1]?.role === 'user';

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 30%, hsla(var(--primary) / 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, hsla(var(--secondary) / 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 70%, hsla(var(--accent) / 0.08) 0%, transparent 40%)',
          }}
        />
        
        {/* Pulsing rings when listening */}
        <AnimatePresence>
          {voiceState === 'listening' && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"
                  initial={{ width: 200, height: 200, opacity: 0.5 }}
                  animate={{ 
                    width: 200 + i * 150 + audioLevel * 100, 
                    height: 200 + i * 150 + audioLevel * 100, 
                    opacity: 0 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.4,
                    ease: 'easeOut'
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Speaking wave animation */}
        <AnimatePresence>
          {voiceState === 'speaking' && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-32"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <svg viewBox="0 0 1440 120" className="w-full h-full" preserveAspectRatio="none">
                <motion.path
                  fill="hsla(var(--primary) / 0.1)"
                  animate={{
                    d: [
                      "M0,60 C360,90 720,30 1080,60 C1260,75 1440,45 1440,60 L1440,120 L0,120 Z",
                      "M0,60 C360,30 720,90 1080,60 C1260,45 1440,75 1440,60 L1440,120 L0,120 Z",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.path
                  fill="hsla(var(--secondary) / 0.08)"
                  animate={{
                    d: [
                      "M0,80 C480,100 960,60 1440,80 L1440,120 L0,120 Z",
                      "M0,80 C480,60 960,100 1440,80 L1440,120 L0,120 Z",
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-card/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full bg-card/50 backdrop-blur-sm transition-colors",
              showTranscript && "bg-primary/20"
            )}
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full bg-card/50 backdrop-blur-sm",
              isMuted && "text-muted-foreground"
            )}
            onClick={() => {
              if (!isMuted && voiceState === 'speaking') {
                stopSpeaking();
              }
              setIsMuted(!isMuted);
            }}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-card/50 backdrop-blur-sm"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-20 pb-40">
        {/* Avatar */}
        <motion.div
          animate={{
            scale: voiceState === 'speaking' ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: voiceState === 'speaking' ? Infinity : 0,
          }}
        >
          <TutorAvatar
            style={preferences.avatarStyle}
            mood={getTutorMood()}
            size="xl"
            showSpeechBubble={false}
          />
        </motion.div>

        {/* Status text */}
        <motion.p
          key={voiceState}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-lg text-muted-foreground font-medium"
        >
          {getStatusText()}
        </motion.p>

        {/* Response display - minimal, centered */}
        <AnimatePresence mode="wait">
          {displayContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "mt-8 max-w-2xl w-full text-center",
                isUserMessage ? "text-muted-foreground italic" : "text-foreground"
              )}
            >
              {isUserMessage ? (
                <p className="text-lg">"{displayContent}"</p>
              ) : (
                <div className="text-xl leading-relaxed prose prose-invert max-w-none">
                  <MathRenderer latex={displayContent.slice(0, 300) + (displayContent.length > 300 ? '...' : '')} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transcript panel */}
      <AnimatePresence>
        {showTranscript && messages.length > 0 && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-card/90 backdrop-blur-lg border-l border-border p-4 pt-20 overflow-y-auto"
          >
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Conversation</h3>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={cn(
                    "text-sm",
                    msg.role === 'user' ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  <span className="font-medium block mb-1">
                    {msg.role === 'user' ? 'You' : preferences.tutorName}:
                  </span>
                  <MathRenderer latex={msg.content} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Large microphone button */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 flex flex-col items-center">
        {/* Audio level indicator */}
        {voiceState === 'listening' && (
          <motion.div
            className="mb-4 h-1 bg-primary/30 rounded-full overflow-hidden"
            style={{ width: 120 }}
          >
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${audioLevel * 100}%` }}
              transition={{ duration: 0.05 }}
            />
          </motion.div>
        )}

        <motion.button
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg",
            voiceState === 'listening' 
              ? "bg-destructive text-destructive-foreground ring-4 ring-destructive/30" 
              : voiceState === 'speaking'
              ? "bg-secondary text-secondary-foreground ring-4 ring-secondary/30"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
            (voiceState === 'processing' || voiceState === 'thinking' || isLoading) && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleMicClick}
          disabled={voiceState === 'processing' || voiceState === 'thinking' || isLoading}
          whileTap={{ scale: 0.95 }}
          animate={voiceState === 'listening' ? { scale: [1, 1.05, 1] } : {}}
          transition={voiceState === 'listening' ? { duration: 0.5, repeat: Infinity } : {}}
        >
          {voiceState === 'listening' ? (
            <MicOff className="w-10 h-10" />
          ) : voiceState === 'speaking' ? (
            <Volume2 className="w-10 h-10" />
          ) : voiceState === 'processing' || voiceState === 'thinking' || isLoading ? (
            <motion.div
              className="w-10 h-10 border-3 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </motion.button>

        <p className="mt-4 text-sm text-muted-foreground">
          {voiceState === 'listening' ? 'Tap to stop' : voiceState === 'speaking' ? 'Tap to interrupt' : 'Tap to speak'}
        </p>
      </div>
    </div>
  );
}
