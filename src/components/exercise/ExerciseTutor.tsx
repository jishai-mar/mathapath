import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { useTutor } from '@/contexts/TutorContext';
import { TutorAvatar } from '@/components/tutor/TutorAvatar';
import { VoiceControls } from '@/components/voice/VoiceControls';
import { 
  X, 
  Send, 
  Lightbulb, 
  HelpCircle, 
  BookOpen,
  Loader2,
  Mic,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ExerciseTutorProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseQuestion: string;
  subtopicName: string;
  currentAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const quickActions = [
  { label: 'Give me a hint', icon: Lightbulb, prompt: 'Can you give me a small hint for this problem without revealing the answer?' },
  { label: 'Explain the concept', icon: BookOpen, prompt: 'Can you explain the concept needed to solve this problem?' },
  { label: 'Where did I go wrong?', icon: HelpCircle, prompt: 'I think I made a mistake. Can you help me figure out where I went wrong?' },
];

export function ExerciseTutor({
  isOpen,
  onClose,
  exerciseQuestion,
  subtopicName,
  currentAnswer,
  difficulty,
}: ExerciseTutorProps) {
  const navigate = useNavigate();
  const { preferences } = useTutor();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latestResponse, setLatestResponse] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ask-tutor', {
        body: {
          question: userMessage,
          subtopicName,
          theoryContext: `Current exercise: ${exerciseQuestion}${currentAnswer ? `\nStudent's current answer attempt: ${currentAnswer}` : ''}\nDifficulty: ${difficulty}`,
          conversationHistory: newMessages.slice(-10),
          tutorName: preferences.tutorName,
          personality: preferences.personality,
          sessionPhase: 'learning',
          tutoringMode: 'hint',
        }
      });

      if (error) throw error;

      const answer = data.answer || "I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      setLatestResponse(answer); // Trigger voice playback
    } catch (error) {
      console.error('Error asking tutor:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, subtopicName, exerciseQuestion, currentAnswer, difficulty, preferences]);

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleVoiceTranscription = (text: string) => {
    if (text.trim()) {
      sendMessage(text);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="fixed right-4 bottom-24 z-50 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
        <TutorAvatar style={preferences.avatarStyle} mood="thinking" size="sm" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{preferences.tutorName}</h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Voice-enabled tutor</p>
            <Mic className="w-3 h-3 text-primary" />
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => navigate('/voice-tutor')}
          title="Fullscreen voice mode"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="h-64 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Stuck? Ask me for help by typing or using voice!
            </p>
            <div className="space-y-2">
              {quickActions.map((action, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <action.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-2",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  "max-w-[85%] p-3 rounded-xl text-sm",
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/50'
                )}>
                  <MathRenderer segments={createSegmentsFromSolution(msg.content)} />
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                <div className="bg-muted/50 p-3 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input with Voice Controls */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border/30 bg-muted/20">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type or use voice..."
              className="min-h-[40px] max-h-24 resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <div className="flex gap-1">
            <VoiceControls 
              onTranscription={handleVoiceTranscription}
              textToSpeak={latestResponse}
              isDisabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
