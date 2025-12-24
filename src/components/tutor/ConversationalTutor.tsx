import { useState, useCallback, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { supabase } from '@/integrations/supabase/client';
import MathRenderer from '@/components/MathRenderer';
import { 
  X, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  Sparkles,
  Lightbulb,
  HelpCircle,
  Phone,
  PhoneOff,
  Loader2
} from 'lucide-react';

interface TranscriptMessage {
  id: string;
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
}

interface ConversationalTutorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationalTutor({ isOpen, onClose }: ConversationalTutorProps) {
  const exerciseContext = useExerciseContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [currentPartial, setCurrentPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fallbackRequested, setFallbackRequested] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastStartAtRef = useRef(0);
  const fallbackTriedRef = useRef(false);
  const manualEndRef = useRef(false);
  const lastOverridesRef = useRef<{ prompt: string; firstMessage: string } | null>(null);

  // Build dynamic context for the agent
  const buildAgentContext = useCallback(() => {
    if (!exerciseContext) {
      return {
        current_question: '',
        subtopic_name: 'wiskunde',
        topic_name: '',
        difficulty: '',
        student_answer: '',
        attempts: 0,
        hints: '',
        conversation_summary: '',
      };
    }

    const recentConvo = exerciseContext.tutorConversation.slice(-5)
      .map(m => `${m.role === 'student' ? 'Student' : 'Tutor'}: ${m.message}`)
      .join('\n');

    return {
      current_question: exerciseContext.currentQuestion || '',
      subtopic_name: exerciseContext.subtopicName || 'wiskunde',
      topic_name: exerciseContext.topicName || '',
      difficulty: exerciseContext.difficulty || 'medium',
      student_answer: exerciseContext.currentAnswer || '',
      attempts: exerciseContext.studentAttempts,
      hints: exerciseContext.hints?.join(' | ') || '',
      last_feedback: exerciseContext.lastFeedback || '',
      conversation_summary: recentConvo,
    };
  }, [exerciseContext]);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    preferHeadphonesForIosDevices: true,
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      setIsConnecting(false);
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');

      // If we disconnect immediately after starting, try a WebSocket fallback once.
      const msSinceStart = Date.now() - lastStartAtRef.current;
      const shouldFallback =
        !manualEndRef.current &&
        !fallbackTriedRef.current &&
        msSinceStart > 0 &&
        msSinceStart < 8000;

      if (shouldFallback) {
        console.warn('WebRTC disconnected quickly; requesting WebSocket fallback...', { msSinceStart });
        fallbackTriedRef.current = true;
        setFallbackRequested(true);
      }
    },
    onDebug: (evt) => {
      // Useful for diagnosing silent failures in WebRTC/DataChannel setup
      console.log('[ElevenLabs debug]', evt);
    },
    onMessage: (message: any) => {
      console.log('Agent message:', message);

      // Handle user transcripts
      if (message.type === 'user_transcript') {
        const userText = message.user_transcription_event?.user_transcript;
        if (userText) {
          setCurrentPartial('');
          const newMessage: TranscriptMessage = {
            id: `user-${Date.now()}`,
            role: 'student',
            content: userText,
            timestamp: new Date(),
          };
          setTranscript((prev) => [...prev, newMessage]);
          exerciseContext?.addConversationMessage('student', userText);
        }
      }

      // Handle agent responses
      if (message.type === 'agent_response') {
        const agentText = message.agent_response_event?.agent_response;
        if (agentText) {
          const newMessage: TranscriptMessage = {
            id: `tutor-${Date.now()}`,
            role: 'tutor',
            content: agentText,
            timestamp: new Date(),
          };
          setTranscript((prev) => [...prev, newMessage]);
          exerciseContext?.addConversationMessage('tutor', agentText);
        }
      }

      // Handle corrections (when user interrupts)
      if (message.type === 'agent_response_correction') {
        const correctedText = message.agent_response_correction_event?.corrected_agent_response;
        if (correctedText) {
          // Update the last tutor message
          setTranscript((prev) => {
            const lastTutorIndex = [...prev].reverse().findIndex((m) => m.role === 'tutor');
            if (lastTutorIndex >= 0) {
              const actualIndex = prev.length - 1 - lastTutorIndex;
              return prev.map((m, i) => (i === actualIndex ? { ...m, content: correctedText } : m));
            }
            return prev;
          });
        }
      }
    },
    onError: (err) => {
      console.error('Conversation error:', err);
      setError('Something went wrong with the connection. Please try again.');
      setIsConnecting(false);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, currentPartial]);

  const buildOverrides = useCallback(() => {
    const context = buildAgentContext();

    const prompt = context.current_question
      ? `You are helping a student with the following math problem:

CURRENT PROBLEM: ${context.current_question}
TOPIC: ${context.subtopic_name}
DIFFICULTY: ${context.difficulty}
${context.student_answer ? `STUDENT'S ANSWER: ${context.student_answer}` : ''}
ATTEMPTS: ${context.attempts}
${context.hints ? `AVAILABLE HINTS: ${context.hints}` : ''}
${context.last_feedback ? `LAST FEEDBACK: ${context.last_feedback}` : ''}
${context.conversation_summary ? `RECENT CONVERSATION:\n${context.conversation_summary}` : ''}

INSTRUCTIONS:
- Speak in short sentences (max 2 sentences at a time)
- Ask one guiding question at a time, then wait
- Default to hint-first help; only give full solutions if asked
- Do NOT give the answer directly - help them discover it themselves
- Use layered help: hint → stronger hint → steps
- When explaining formulas, say them clearly (e.g., "x squared plus 2x")
- Check in regularly: "What do you think the next step is?"
- Be patient and encouraging`
      : `The student wants help with math but is not working on a specific problem.
Help with general questions or suggest starting a practice session.
Keep answers short (max 2 sentences at a time).`;

    const firstMessage = context.current_question
      ? `Hi! Quick check: what's your goal for this problem, and what have you tried so far?`
      : `Hi! What's your goal right now, and how can I help?`;

    return { prompt, firstMessage };
  }, [buildAgentContext]);

  const startWebrtc = useCallback(async () => {
    // Get conversation token from backend function
    const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-conversation-token', {
      body: {},
    });

    if (fnError || !data?.token) {
      throw new Error('Could not connect to the tutor');
    }

    const overrides = buildOverrides();
    lastOverridesRef.current = overrides;

    await conversation.startSession({
      conversationToken: data.token,
      connectionType: 'webrtc',
      overrides: {
        agent: {
          prompt: { prompt: overrides.prompt },
          firstMessage: overrides.firstMessage,
          language: 'en',
        },
      },
    });

    setTranscript([
      {
        id: 'greeting',
        role: 'tutor',
        content: overrides.firstMessage,
        timestamp: new Date(),
      },
    ]);
  }, [buildOverrides, conversation]);

  const startWebsocketFallback = useCallback(async () => {
    const overrides = lastOverridesRef.current ?? buildOverrides();
    lastOverridesRef.current = overrides;

    const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-conversation-token', {
      body: { mode: 'signed_url' },
    });

    if (fnError || !data?.signedUrl) {
      throw new Error('Could not reconnect (fallback)');
    }

    await conversation.startSession({
      signedUrl: data.signedUrl,
      connectionType: 'websocket',
      overrides: {
        agent: {
          prompt: { prompt: overrides.prompt },
          firstMessage: overrides.firstMessage,
          language: 'en',
        },
      },
    });

    setTranscript([
      {
        id: 'greeting',
        role: 'tutor',
        content: overrides.firstMessage,
        timestamp: new Date(),
      },
    ]);
  }, [buildOverrides, conversation]);

  useEffect(() => {
    if (!fallbackRequested) return;

    (async () => {
      try {
        setIsConnecting(true);
        setError('WebRTC connection dropped. Retrying...');
        await startWebsocketFallback();
        setError(null);
      } catch (e) {
        console.error('WebSocket fallback failed:', e);
        setError(e instanceof Error ? e.message : 'Could not reconnect');
      } finally {
        setFallbackRequested(false);
        setIsConnecting(false);
      }
    })();
  }, [fallbackRequested, startWebsocketFallback]);

  // Start conversation
  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    manualEndRef.current = false;
    fallbackTriedRef.current = false;
    lastStartAtRef.current = Date.now();

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await startWebrtc();
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError(err instanceof Error ? err.message : 'Could not connect');
      setIsConnecting(false);
    }
  }, [startWebrtc]);

  // End conversation
  const endConversation = useCallback(async () => {
    manualEndRef.current = true;
    await conversation.endSession();
    setTranscript([]);
  }, [conversation]);

  // Handle close
  const handleClose = useCallback(async () => {
    if (conversation.status === 'connected') {
      await endConversation();
    }
    onClose();
  }, [conversation.status, endConversation, onClose]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (isMuted) {
      await conversation.setVolume({ volume: 1 });
    } else {
      await conversation.setVolume({ volume: 0 });
    }
    setIsMuted(!isMuted);
  }, [isMuted, conversation]);

  // Get status indicator
  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (conversation.status === 'connected') {
      if (conversation.isSpeaking) return 'Tutor speaking...';
      return 'Listening...';
    }
    return 'Not connected';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                conversation.status === 'connected' 
                  ? conversation.isSpeaking 
                    ? 'bg-primary/20 animate-pulse' 
                    : 'bg-secondary/20'
                  : 'bg-muted'
              }`}>
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Talk to your Tutor</h3>
                <p className="text-xs text-muted-foreground">{getStatusText()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {conversation.status === 'connected' && (
                <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current Exercise Context */}
          {exerciseContext?.currentQuestion && (
            <div className="px-4 py-3 border-b border-border bg-primary/5">
              <p className="text-xs text-muted-foreground mb-1">Current problem:</p>
              <div className="text-sm">
                <MathRenderer latex={exerciseContext.currentQuestion} />
              </div>
            </div>
          )}

          {/* Transcript */}
          <ScrollArea className="flex-1 p-4 min-h-[200px]" ref={scrollRef}>
            <div className="space-y-3">
              {transcript.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'student'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      <MathRenderer latex={message.content} />
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Speaking indicator */}
              {conversation.isSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Error message */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Quick Actions */}
          {conversation.status === 'connected' && (
            <div className="px-4 py-2 border-t border-border flex gap-2 overflow-x-auto">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-8 text-xs gap-1.5 rounded-full"
                onClick={() => {
                  // Speak a hint request - the agent will hear this
                  // We simulate this by showing it in transcript
                }}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Hint
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-8 text-xs gap-1.5 rounded-full"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Explain
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-8 text-xs gap-1.5 rounded-full"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                I'm stuck
              </Button>
            </div>
          )}

          {/* Call Controls */}
          <div className="p-4 border-t border-border bg-muted/30">
            {conversation.status === 'connected' ? (
              <div className="flex items-center justify-center gap-4">
                {/* Listening indicator */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mic className={`w-4 h-4 ${!conversation.isSpeaking ? 'text-secondary animate-pulse' : ''}`} />
                  <span>{conversation.isSpeaking ? 'Tutor speaking' : 'You can speak'}</span>
                </div>
                
                {/* End call button */}
                <Button
                  onClick={endConversation}
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-14 w-14 p-0"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={startConversation}
                disabled={isConnecting}
                size="lg"
                className="w-full h-14 rounded-2xl text-lg gap-3"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    Start conversation
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
