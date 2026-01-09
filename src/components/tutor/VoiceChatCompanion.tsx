import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { authenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { 
  X, 
  Send, 
  MessageCircle,
  Sparkles,
  Lightbulb,
  HelpCircle,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export function VoiceChatCompanion() {
  const exerciseContext = useExerciseContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Add initial greeting when panel opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hasExercise = exerciseContext?.currentQuestion;
      
      const greeting = hasExercise
        ? `Hi! I see you're working on a ${exerciseContext?.subtopicName || 'math'} problem. You can type here or talk to me using the voice button. What are you stuck on?`
        : 'Hello! I\'m your math tutor. You can type here or talk to me using the voice button. How can I help you?';
      
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

      conversationHistory.push({ role: 'user' as const, content: input.trim() });

      const response = await authenticatedFetch('ask-tutor', {
        method: 'POST',
        body: JSON.stringify({
          message: input.trim(),
          context,
          conversationHistory,
          mode: 'help_with_exercise',
        }),
      });

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
          ? { ...m, content: 'Sorry, something went wrong. Please try again.', isStreaming: false }
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
        message = 'Can you give me a hint?';
        break;
      case 'explain':
        message = 'Can you explain how I should approach this?';
        break;
      case 'stuck':
        message = 'I\'m stuck and don\'t know where to start.';
        break;
    }
    setInput(message);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <>
      {/* Toggle Button - positioned above the ElevenLabs widget */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-28 right-6 z-40"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              variant="secondary"
              className="rounded-full h-12 w-12 shadow-lg p-0"
              title="Open text chat"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-28 right-6 w-80 bg-card border border-border rounded-2xl shadow-xl z-40 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Chat with Tutor</h3>
                  {exerciseContext?.subtopicName && (
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {exerciseContext.subtopicName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-xl px-3 py-2 ${
                              message.role === 'student'
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-muted rounded-bl-sm'
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap">
                              <MathRenderer segments={createSegmentsFromSolution(message.content)} />
                            </div>
                            {message.isStreaming && (
                              <span className="inline-block w-1.5 h-3 bg-current animate-pulse ml-0.5" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Quick Actions */}
                  <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('hint')}
                      className="shrink-0 h-7 text-xs gap-1 rounded-full"
                    >
                      <Lightbulb className="w-3 h-3" />
                      Hint
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('explain')}
                      className="shrink-0 h-7 text-xs gap-1 rounded-full"
                    >
                      <Sparkles className="w-3 h-3" />
                      Explain
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('stuck')}
                      className="shrink-0 h-7 text-xs gap-1 rounded-full"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Stuck
                    </Button>
                  </div>

                  {/* Input */}
                  <div className="p-3 pt-0">
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                      className="flex gap-2"
                    >
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        disabled={isLoading}
                        className="flex-1 h-9 text-sm rounded-full"
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        className="h-9 w-9 rounded-full shrink-0"
                        disabled={!input.trim() || isLoading}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
