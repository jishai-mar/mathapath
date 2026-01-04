import { useState, useCallback, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { normalizeSpokenMath, mathToSpoken, containsMathContent } from '@/lib/spokenMathParser';
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
  Loader2,
  Calculator
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
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [currentPartial, setCurrentPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fallbackRequested, setFallbackRequested] = useState(false);
  const [studentName, setStudentName] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastStartAtRef = useRef(0);
  const fallbackTriedRef = useRef(false);
  const manualEndRef = useRef(false);
  const startInFlightRef = useRef(false);
  const lastOverridesRef = useRef<{ prompt: string; firstMessage: string } | null>(null);

  // Load student name for personalization
  useEffect(() => {
    const loadStudentName = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, display_name')
        .eq('id', user.id)
        .single();
      if (data) {
        setStudentName(data.first_name || data.display_name || '');
      }
    };
    loadStudentName();
  }, [user?.id]);

  // Build dynamic context for the agent
  const buildAgentContext = useCallback(() => {
    if (!exerciseContext) {
      return {
        current_question: '',
        subtopic_name: 'math',
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
      subtopic_name: exerciseContext.subtopicName || 'math',
      topic_name: exerciseContext.topicName || '',
      difficulty: exerciseContext.difficulty || 'medium',
      student_answer: exerciseContext.currentAnswer || '',
      attempts: exerciseContext.studentAttempts,
      hints: exerciseContext.hints?.join(' | ') || '',
      last_feedback: exerciseContext.lastFeedback || '',
      conversation_summary: recentConvo,
    };
  }, [exerciseContext]);

  // Client tools for Gilbert to take actions
  const clientTools = {
    requestEasierExercise: useCallback(async () => {
      console.log('Gilbert: Requesting easier exercise');
      window.dispatchEvent(new CustomEvent('gilbert-request-easier'));
      return 'I will get you an easier exercise. Give me a moment...';
    }, []),
    
    requestHarderExercise: useCallback(async () => {
      console.log('Gilbert: Requesting harder exercise');
      window.dispatchEvent(new CustomEvent('gilbert-request-harder'));
      return 'Challenge accepted! Let me find you a harder one...';
    }, []),
    
    solveExercise: useCallback(async () => {
      console.log('Gilbert: Solving exercise');
      if (!exerciseContext?.currentQuestion) {
        return 'There is no current exercise to solve. Would you like to start a practice session?';
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('solve-exercise', {
          body: {
            question: exerciseContext.currentQuestion,
            subtopicName: exerciseContext.subtopicName,
            correctAnswer: exerciseContext.correctAnswer,
          },
        });
        
        if (error || !data) {
          return 'Let me walk you through this step by step. First, let\'s identify what we know and what we need to find.';
        }
        
        // Dispatch event to show walkthrough in UI
        window.dispatchEvent(new CustomEvent('gilbert-show-solution', { 
          detail: data 
        }));
        
        // Return a spoken summary with math converted to speech-friendly format
        const steps = data.steps || [];
        const spokenSteps = steps.slice(0, 3).map((s: any, i: number) => {
          const explanation = mathToSpoken(s.explanation || '');
          return `Step ${i + 1}: ${explanation}`;
        }).join('. ');
        
        const spokenAnswer = mathToSpoken(data.finalAnswer || exerciseContext.correctAnswer || '');
        return `Here's how to solve this: ${spokenSteps}${steps.length > 3 ? '. And there are more steps...' : ''} The final answer is ${spokenAnswer}.`;
      } catch (err) {
        console.error('Error solving exercise:', err);
        return 'Let me explain this problem to you step by step. What part would you like to start with?';
      }
    }, [exerciseContext]),
    
    giveHint: useCallback(async () => {
      console.log('Gilbert: Giving hint');
      const hints = exerciseContext?.hints;
      const attempts = exerciseContext?.studentAttempts || 0;
      
      if (hints && hints.length > 0) {
        const hintIndex = Math.min(attempts, hints.length - 1);
        const hint = hints[hintIndex];
        
        // Dispatch event for UI
        window.dispatchEvent(new CustomEvent('gilbert-hint', { 
          detail: { hint, hintNumber: hintIndex + 1 } 
        }));
        
        // Convert any math in the hint to spoken form
        const spokenHint = mathToSpoken(hint);
        return `Here's hint number ${hintIndex + 1}: ${spokenHint}`;
      }
      
      // Generate a contextual hint based on the problem type
      if (exerciseContext?.currentQuestion) {
        const question = exerciseContext.currentQuestion.toLowerCase();
        if (question.includes('solve') || question.includes('=')) {
          return 'Start by isolating the variable. What operations can you do to both sides of the equation?';
        } else if (question.includes('simplify')) {
          return 'Look for like terms that you can combine. What terms have the same variable?';
        } else if (question.includes('factor')) {
          return 'Think about what numbers multiply to give you the constant term. What pairs of factors should you consider?';
        }
      }
      
      return 'Think about what the problem is really asking. What information do you already have, and what do you need to find?';
    }, [exerciseContext]),
    
    checkAnswer: useCallback(async (params: { studentAnswer: string }) => {
      console.log('Gilbert: Checking answer', params);
      if (!exerciseContext?.correctAnswer) {
        return 'I don\'t have a problem to check. Can you tell me what problem you\'re working on?';
      }
      
      const normalizedStudent = normalizeSpokenMath(params.studentAnswer || '').toLowerCase().replace(/\s+/g, '');
      const normalizedCorrect = (exerciseContext.correctAnswer || '').toLowerCase().replace(/\s+/g, '');
      
      if (normalizedStudent === normalizedCorrect) {
        window.dispatchEvent(new CustomEvent('gilbert-correct-answer'));
        return 'That\'s correct! Excellent work! Would you like to try another problem or shall we move on?';
      } else {
        window.dispatchEvent(new CustomEvent('gilbert-incorrect-answer', {
          detail: { studentAnswer: params.studentAnswer }
        }));
        return `Hmm, ${mathToSpoken(params.studentAnswer)} isn't quite right. Would you like a hint, or should we work through it together?`;
      }
    }, [exerciseContext]),
    
    explainTheory: useCallback(async () => {
      console.log('Gilbert: Explaining theory');
      if (!exerciseContext?.subtopicId && !exerciseContext?.subtopicName) {
        return 'What topic would you like me to explain? Just tell me and I\'ll help!';
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-theory-content', {
          body: {
            subtopicId: exerciseContext.subtopicId,
            subtopicName: exerciseContext.subtopicName,
          },
        });
        
        if (error || !data) {
          return `Let me explain ${exerciseContext.subtopicName} to you. What specifically would you like to understand better?`;
        }
        
        // Dispatch event for UI
        window.dispatchEvent(new CustomEvent('gilbert-theory', { 
          detail: data 
        }));
        
        // Return a short spoken explanation with math in speech form
        const explanation = data.explanation || data.content || '';
        const sentences = explanation.split('.').slice(0, 3);
        const shortExplanation = sentences.map((s: string) => mathToSpoken(s)).join('.') + '.';
        
        return shortExplanation;
      } catch (err) {
        console.error('Error generating theory:', err);
        return `Let me explain the key concepts of ${exerciseContext?.subtopicName || 'this topic'} to you. What part are you most curious about?`;
      }
    }, [exerciseContext]),
    
    repeatLastStatement: useCallback(async () => {
      console.log('Gilbert: Repeating last statement');
      return 'Let me repeat that for you.';
    }, []),
    
    slowDown: useCallback(async () => {
      console.log('Gilbert: Slowing down');
      return 'Of course, let me explain that more slowly and clearly.';
    }, []),
  };

  // ElevenLabs conversation hook
  const conversation = useConversation({
    preferHeadphonesForIosDevices: true,
    clientTools,
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      setIsConnecting(false);
      setError(null);
      startInFlightRef.current = false;
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
      startInFlightRef.current = false;

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
          
          // Parse spoken math and check if there's math content
          const normalizedText = normalizeSpokenMath(userText);
          const hasMath = containsMathContent(userText);
          
          const newMessage: TranscriptMessage = {
            id: `user-${Date.now()}`,
            role: 'student',
            content: hasMath ? normalizedText : userText,
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
      
      // Handle client tool calls
      if (message.type === 'client_tool_call') {
        const toolName = message.client_tool_call?.tool_name;
        console.log('Gilbert tool call:', toolName);
      }
    },
    onError: (err: unknown) => {
      // Safely handle error - ElevenLabs may pass various error formats
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String((err as { message?: unknown }).message)
        : 'Unknown error';
      console.error('Conversation error:', errorMessage, err);
      setError('Something went wrong with the connection. Please try again.');
      setIsConnecting(false);
    },
  });

  // Keep output volume in sync (prevents "connected but silent")
  useEffect(() => {
    if (conversation.status !== 'connected') return;

    (async () => {
      try {
        await conversation.setVolume({ volume: isMuted ? 0 : 1 });
      } catch {
        // ignore
      }
    })();
  }, [conversation, conversation.status, isMuted]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, currentPartial]);

  const buildOverrides = useCallback(() => {
    const context = buildAgentContext();
    const name = studentName ? `, ${studentName}` : '';

    const mathUnderstandingRules = `
MATH UNDERSTANDING RULES (CRITICAL):
When students speak math verbally, you MUST interpret it correctly:
- "x squared" or "x to the second" = x²
- "x cubed" = x³
- "two x" or "2x" = 2x (coefficient times variable)
- "x plus three" = x + 3
- "x minus two" = x - 2
- "three over four" or "three fourths" = 3/4
- "square root of x" = √x
- "negative x" or "minus x" = -x

When YOU speak math, always say it clearly:
- Say "x squared" not "x to the power of 2"
- Say "two x plus three" not "2x+3"
- Say "equals" not "is equal to"
- Spell out fractions: "one half" not "0.5"

ALWAYS confirm understanding of complex expressions:
- Student says "two x squared plus three x equals zero"
- You respond: "So we have 2x² + 3x = 0, right?"`;

    const prompt = context.current_question
      ? `You are Gilbert, a friendly, patient, and encouraging math tutor having a real-time voice conversation with a student.

${mathUnderstandingRules}

CURRENT PROBLEM: ${context.current_question}
TOPIC: ${context.subtopic_name}
DIFFICULTY: ${context.difficulty}
${context.student_answer ? `STUDENT'S CURRENT ANSWER: ${context.student_answer}` : ''}
ATTEMPTS SO FAR: ${context.attempts}
${context.hints ? `AVAILABLE HINTS: ${context.hints}` : ''}
${context.last_feedback ? `LAST FEEDBACK: ${context.last_feedback}` : ''}
${context.conversation_summary ? `RECENT CONVERSATION:\n${context.conversation_summary}` : ''}

AVAILABLE TOOLS (use when appropriate):
- requestEasierExercise: When student is struggling and wants something simpler
- requestHarderExercise: When student is bored and wants a challenge
- solveExercise: ONLY when student explicitly asks "show me the answer" or "solve it for me"
- giveHint: When student asks for help or is stuck
- checkAnswer: When student tells you their answer to verify it
- explainTheory: When student needs concept explanation
- repeatLastStatement: When student says "repeat that" or "say again"
- slowDown: When student asks you to slow down

TUTORING APPROACH:
1. NEVER give the answer directly - guide them to discover it
2. Ask ONE question at a time, then WAIT for response
3. Keep responses SHORT (1-2 sentences max for voice)
4. Use the Socratic method: "What do you think happens if...?"
5. Celebrate small wins: "Exactly!" "Great thinking!" "You've got it!"
6. When they're stuck: Give a small hint first, then bigger hints if needed
7. If they say an answer verbally, use checkAnswer to verify it
8. Speak naturally - you're having a conversation, not reading a textbook

PERSONALITY:
- Warm and encouraging, like a supportive older sibling
- Patient - never frustrated, even if they don't get it quickly
- Enthusiastic about math - show genuine interest
- Respond warmly when called "Gilbert"
- Use their name occasionally if you know it`
      : `You are Gilbert, a friendly math tutor having a voice conversation.

${mathUnderstandingRules}

The student is not currently working on a specific problem. You can:
- Chat about math topics they're interested in
- Help with any math questions they have
- Suggest starting a practice session

Keep responses SHORT (1-2 sentences) since this is voice.
Be warm, friendly, and enthusiastic about math!
Respond happily when called "Gilbert".`;

    // Generate personalized first message
    const getRandomFirstMessage = () => {
      const nameGreeting = studentName ? `Hey ${studentName}!` : 'Hey there!';
      
      if (context.current_question) {
        const problemGreetings = [
          `${nameGreeting} I see you're working on ${context.subtopic_name}. What part has you thinking?`,
          `${nameGreeting} Nice problem you've got here! Where would you like to start?`,
          `Alright${name}, let's figure this one out together! What have you tried so far?`,
          `${nameGreeting} This looks like a fun one! What's your first instinct?`,
          `I'm here to help${name}! Walk me through what you're thinking.`,
          `${nameGreeting} Let's break this down step by step. What do we know?`,
          `Ready when you are${name}! What's got you stuck?`,
          `Great choice picking ${context.subtopic_name}${name}! What's your game plan?`,
        ];
        return problemGreetings[Math.floor(Math.random() * problemGreetings.length)];
      } else {
        const generalGreetings = [
          `${nameGreeting} What math adventure are we going on today?`,
          `Hi${name}! Ready to do some math together?`,
          `${nameGreeting} I'm here to help with anything math-related!`,
          `Good to see you${name}! What would you like to explore?`,
          `${nameGreeting} Got a tricky problem or want to practice something?`,
          `I'm all ears${name}! What math topic can I help with?`,
          `${nameGreeting} Let's get started! What are we working on?`,
          `Hi${name}! Equations, geometry, or something else? I'm ready!`,
        ];
        return generalGreetings[Math.floor(Math.random() * generalGreetings.length)];
      }
    };

    const firstMessage = getRandomFirstMessage();

    return { prompt, firstMessage };
  }, [buildAgentContext, studentName]);

  const safeResetSession = useCallback(async () => {
    try {
      // endSession is safe even if already disconnected
      await conversation.endSession();
    } catch {
      // ignore
    }

    // Give the SDK a moment to fully tear down PC/WebSocket before restarting
    await new Promise((r) => setTimeout(r, 250));
  }, [conversation]);

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

        await safeResetSession();
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
  }, [fallbackRequested, safeResetSession, startWebsocketFallback]);

  // Start conversation
  const startConversation = useCallback(async () => {
    if (startInFlightRef.current) return;
    startInFlightRef.current = true;

    setIsConnecting(true);
    setError(null);

    manualEndRef.current = false;
    fallbackTriedRef.current = false;
    lastStartAtRef.current = Date.now();

    try {
      await safeResetSession();

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await startWebrtc();
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError(err instanceof Error ? err.message : 'Could not connect');
      setIsConnecting(false);
      startInFlightRef.current = false;
    }
  }, [safeResetSession, startWebrtc]);

  // Save conversation to database for learning insights
  const saveConversation = useCallback(async (messages: TranscriptMessage[]) => {
    if (!user?.id || messages.length < 2) return;
    
    try {
      const conversationText = messages
        .map(m => `${m.role === 'student' ? 'Student' : 'Gilbert'}: ${m.content}`)
        .join('\n');
      
      // Find any math-related insights from the conversation
      const studentMessages = messages.filter(m => m.role === 'student');
      const tutorMessages = messages.filter(m => m.role === 'tutor');
      
      // Check if conversation contained learning moments
      const hadHelpRequest = studentMessages.some(m => 
        /help|stuck|don't understand|confused|hint/i.test(m.content)
      );
      
      const hadBreakthrough = tutorMessages.some(m => 
        /correct|exactly|you've got it|great|well done|perfect/i.test(m.content)
      );
      
      // Save as session note
      await supabase.from('student_session_notes').insert({
        user_id: user.id,
        note_type: 'voice_conversation',
        content: conversationText,
        subtopic_name: exerciseContext?.subtopicName || 'General Math',
        personal_note: hadBreakthrough ? 'Student had a breakthrough moment!' : 
                       hadHelpRequest ? 'Student needed help with this topic' : null,
      });
      
      console.log('Saved voice conversation to database');
    } catch (err) {
      console.error('Error saving conversation:', err);
    }
  }, [user?.id, exerciseContext?.subtopicName]);

  // End conversation
  const endConversation = useCallback(async () => {
    manualEndRef.current = true;
    
    // Save the conversation before clearing
    if (transcript.length > 0) {
      await saveConversation(transcript);
    }
    
    await conversation.endSession();
    setTranscript([]);
  }, [conversation, transcript, saveConversation]);

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
                <MathRenderer segments={createSegmentsFromSolution(exerciseContext.currentQuestion)} />
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
                      <MathRenderer segments={createSegmentsFromSolution(message.content)} />
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
