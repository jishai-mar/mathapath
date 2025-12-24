import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { supabase } from '@/integrations/supabase/client';
import MathRenderer from '@/components/MathRenderer';
import { 
  X, 
  Send, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  Sparkles,
  Lightbulb,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Message {
  id: string;
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface HybridTutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HybridTutorPanel({ isOpen, onClose }: HybridTutorPanelProps) {
  const exerciseContext = useExerciseContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Add initial greeting when panel opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const context = exerciseContext?.getContextForTutor();
      const hasExercise = exerciseContext?.currentQuestion;
      
      const greeting = hasExercise
        ? `Hallo! Ik zie dat je werkt aan een opgave over ${exerciseContext?.subtopicName || 'wiskunde'}. Waar loop je tegenaan? Vertel me wat je al hebt geprobeerd.`
        : 'Hallo! Ik ben je wiskundige tutor. Hoe kan ik je helpen?';
      
      setMessages([{
        id: 'greeting',
        role: 'tutor',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, exerciseContext]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'student',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    exerciseContext?.addConversationMessage('student', input.trim());
    setInput('');
    setIsLoading(true);

    // Add streaming placeholder
    const streamingId = `tutor-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: streamingId,
      role: 'tutor',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }]);

    try {
      // Build context for the AI
      const context = exerciseContext?.getContextForTutor() || '';
      
      const conversationHistory = messages.map(m => ({
        role: m.role === 'tutor' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));

      // Add the new user message
      conversationHistory.push({ role: 'user' as const, content: input.trim() });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-tutor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: input.trim(),
            context,
            conversationHistory,
            mode: 'help_with_exercise',
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  setMessages(prev => prev.map(m => 
                    m.id === streamingId 
                      ? { ...m, content: fullResponse }
                      : m
                  ));
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }

      // Mark as not streaming
      setMessages(prev => prev.map(m => 
        m.id === streamingId 
          ? { ...m, isStreaming: false }
          : m
      ));

      exerciseContext?.addConversationMessage('tutor', fullResponse);

    } catch (error) {
      console.error('Error getting tutor response:', error);
      setMessages(prev => prev.map(m => 
        m.id === streamingId 
          ? { ...m, content: 'Sorry, er ging iets mis. Probeer het opnieuw.', isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    let message = '';
    switch (action) {
      case 'hint':
        message = 'Kun je me een hint geven?';
        break;
      case 'explain':
        message = 'Kun je uitleggen hoe ik dit moet aanpakken?';
        break;
      case 'stuck':
        message = 'Ik zit vast en weet niet waar te beginnen.';
        break;
      case 'check':
        message = exerciseContext?.currentAnswer 
          ? `Is mijn antwoord "${exerciseContext.currentAnswer}" correct?`
          : 'Kun je mijn aanpak controleren?';
        break;
    }
    setInput(message);
    setTimeout(() => handleSend(), 100);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-card border-l border-border shadow-xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Tutor Chat</h3>
              <p className="text-xs text-muted-foreground">
                {exerciseContext?.subtopicName || 'Hulp beschikbaar'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Context Preview */}
        {exerciseContext?.currentQuestion && (
          <div className="border-b border-border">
            <button
              onClick={() => setShowContext(!showContext)}
              className="w-full p-3 flex items-center justify-between text-sm hover:bg-muted/50 transition-colors"
            >
              <span className="text-muted-foreground">Huidige opgave context</span>
              {showContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {showContext && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 pb-3 overflow-hidden"
                >
                  <div className="p-3 rounded-lg bg-muted/30 text-sm space-y-2">
                    <p className="font-medium">Vraag:</p>
                    <div className="text-muted-foreground">
                      <MathRenderer latex={exerciseContext.currentQuestion} />
                    </div>
                    {exerciseContext.currentAnswer && (
                      <>
                        <p className="font-medium mt-2">Jouw antwoord:</p>
                        <p className="text-muted-foreground">{exerciseContext.currentAnswer}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'student'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    <MathRenderer latex={message.content} />
                  </div>
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="p-3 border-t border-border flex gap-2 overflow-x-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('hint')}
            className="shrink-0 gap-1.5"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Hint
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('explain')}
            className="shrink-0 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Uitleg
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('stuck')}
            className="shrink-0 gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Ik zit vast
          </Button>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Stel je vraag..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
