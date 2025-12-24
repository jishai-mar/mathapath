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
  const scrollRef = useRef<HTMLDivElement>(null);

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
      .map(m => `${m.role === 'student' ? 'Leerling' : 'Tutor'}: ${m.message}`)
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
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      setIsConnecting(false);
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
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
          setTranscript(prev => [...prev, newMessage]);
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
          setTranscript(prev => [...prev, newMessage]);
          exerciseContext?.addConversationMessage('tutor', agentText);
        }
      }

      // Handle corrections (when user interrupts)
      if (message.type === 'agent_response_correction') {
        const correctedText = message.agent_response_correction_event?.corrected_agent_response;
        if (correctedText) {
          // Update the last tutor message
          setTranscript(prev => {
            const lastTutorIndex = [...prev].reverse().findIndex(m => m.role === 'tutor');
            if (lastTutorIndex >= 0) {
              const actualIndex = prev.length - 1 - lastTutorIndex;
              return prev.map((m, i) => 
                i === actualIndex ? { ...m, content: correctedText } : m
              );
            }
            return prev;
          });
        }
      }
    },
    onError: (err) => {
      console.error('Conversation error:', err);
      setError('Er ging iets mis met de verbinding. Probeer opnieuw.');
      setIsConnecting(false);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, currentPartial]);

  // Start conversation
  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get conversation token from edge function
      const { data, error: fnError } = await supabase.functions.invoke(
        'elevenlabs-conversation-token',
        { body: {} }
      );

      if (fnError || !data?.token) {
        throw new Error('Kon geen verbinding maken met de tutor');
      }

      // Build context for the agent
      const context = buildAgentContext();

      // Build the dynamic prompt with exercise context
      const dynamicPrompt = context.current_question
        ? `Je helpt nu een student met de volgende wiskunde opgave:

HUIDIGE OPGAVE: ${context.current_question}
ONDERWERP: ${context.subtopic_name}
MOEILIJKHEID: ${context.difficulty}
${context.student_answer ? `ANTWOORD VAN STUDENT: ${context.student_answer}` : ''}
AANTAL POGINGEN: ${context.attempts}
${context.hints ? `BESCHIKBARE HINTS: ${context.hints}` : ''}
${context.last_feedback ? `LAATSTE FEEDBACK: ${context.last_feedback}` : ''}
${context.conversation_summary ? `RECENTE CONVERSATIE:\n${context.conversation_summary}` : ''}

INSTRUCTIES:
- Spreek in korte zinnen (max 2 zinnen per keer)
- Vraag eerst wat de student al heeft geprobeerd
- Geef NIET direct het antwoord - help ze zelf ontdekken
- Gebruik gelaagde hulp: hint → sterkere hint → stappen
- Als je formules uitlegt, zeg ze duidelijk (bijv. "x kwadraat plus 2x")
- Check regelmatig: "Wat denk je dat de volgende stap is?"
- Wees geduldig en moedigend`
        : `De student wil hulp met wiskunde maar werkt niet aan een specifieke opgave.
Help met algemene vragen of verwijs naar het starten van een oefensessie.
Houd antwoorden kort (max 2 zinnen per keer).`;

      // Start the conversation with dynamic context
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
        overrides: {
          agent: {
            prompt: {
              prompt: dynamicPrompt,
            },
            firstMessage: context.current_question
              ? `Hoi! Ik zie dat je werkt aan ${context.subtopic_name}. Waar loop je tegenaan?`
              : 'Hallo! Ik ben je wiskunde tutor. Hoe kan ik je vandaag helpen?',
          },
        },
      });

      // Add the first message to transcript
      const firstMessage = context.current_question
        ? `Hoi! Ik zie dat je werkt aan ${context.subtopic_name}. Waar loop je tegenaan?`
        : 'Hallo! Ik ben je wiskunde tutor. Hoe kan ik je vandaag helpen?';
      
      setTranscript([{
        id: 'greeting',
        role: 'tutor',
        content: firstMessage,
        timestamp: new Date(),
      }]);

    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError(err instanceof Error ? err.message : 'Kon geen verbinding maken');
      setIsConnecting(false);
    }
  }, [conversation, buildAgentContext]);

  // End conversation
  const endConversation = useCallback(async () => {
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
    if (isConnecting) return 'Verbinden...';
    if (conversation.status === 'connected') {
      if (conversation.isSpeaking) return 'Tutor spreekt...';
      return 'Luisteren...';
    }
    return 'Niet verbonden';
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
                <h3 className="font-semibold">Praat met je Tutor</h3>
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
              <p className="text-xs text-muted-foreground mb-1">Huidige opgave:</p>
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
                Uitleg
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-8 text-xs gap-1.5 rounded-full"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Ik zit vast
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
                  <span>{conversation.isSpeaking ? 'Tutor spreekt' : 'Jij kunt praten'}</span>
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
                    Verbinden...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    Start gesprek
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
