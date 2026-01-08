import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, HelpCircle, BookOpen, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useTutor } from '@/contexts/TutorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { TutorAvatar } from './TutorAvatar';
import MathRenderer from '@/components/MathRenderer';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import MathCalculator from '@/components/tools/MathCalculator';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GlobalTutorChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const STUCK_PHRASES = [
  "i don't understand",
  "i'm stuck",
  "stuck on",
  "don't get it",
  "help me",
  "confused",
  "what do i do",
  "how do i",
  "i can't figure",
  "part a",
  "part b",
  "part c",
  "this problem",
  "this question",
];

export function GlobalTutorChat({ isOpen, onClose }: GlobalTutorChatProps) {
  const { preferences } = useTutor();
  const { user } = useAuth();
  const { state, getContextSummary } = useAppContext();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate initial greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      generateGreeting();
    }
  }, [isOpen]);

  const generateGreeting = async () => {
    const hasContext = state.currentQuestion || state.selectedLesson;
    
    let greeting = `Hi! I'm ${preferences.tutorName}, your math tutor. `;
    
    if (hasContext) {
      if (state.selectedLesson) {
        greeting += `I see you're working on "${state.selectedLesson.name}". `;
      }
      if (state.currentQuestion) {
        greeting += `I can see the problem you're looking at. `;
      }
      greeting += `How can I help you? Feel free to ask me anything or just say "I'm stuck" and I'll help you with what's on screen.`;
    } else {
      greeting += `What would you like to work on today? I can help you with any math topic.`;
    }
    
    setMessages([{ role: 'assistant', content: greeting }]);
  };

  const detectStuckRequest = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    return STUCK_PHRASES.some(phrase => lowerMessage.includes(phrase));
  };

  const buildContextAwarePrompt = (userMessage: string): string => {
    const contextSummary = getContextSummary();
    const isStuckRequest = detectStuckRequest(userMessage);
    
    let prompt = userMessage;
    
    if (isStuckRequest && state.currentQuestion) {
      prompt = `The student says: "${userMessage}"

IMPORTANT: The student is asking for help with what they're currently working on. Here is the full context of what they're seeing:

${contextSummary}

Based on this context:
1. Identify what specific part or concept they might be stuck on
2. If they have answers entered, analyze if those answers show any misconceptions
3. Start by briefly acknowledging the problem they're working on
4. Then provide step-by-step guidance without giving away the answer
5. Use the Socratic method to guide them to discover the solution`;
    } else if (contextSummary && state.currentQuestion) {
      prompt = `User message: "${userMessage}"

Current app context (what the student is viewing):
${contextSummary}

Respond helpfully while being aware of what they're currently working on.`;
    }
    
    return prompt;
  };

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const contextAwarePrompt = buildContextAwarePrompt(userMessage);
      
      const { data, error } = await supabase.functions.invoke('ask-tutor', {
        body: {
          question: contextAwarePrompt,
          subtopicName: state.selectedLesson?.name || state.selectedTopic?.name || 'General Math',
          theoryContext: state.additionalContext || '',
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          tutorName: preferences.tutorName,
          personality: preferences.personality,
          sessionPhase: 'learning',
          userId: user?.id,
          tutoringMode: 'hint',
        }
      });

      if (error) throw error;

      const answer = data.answer || "I'm sorry, I couldn't generate a response. Please try again.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      console.error('Error asking tutor:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'stuck':
        sendMessage("I'm stuck on this problem. Can you help me understand it?");
        break;
      case 'explain':
        sendMessage("Can you explain the concept behind this?");
        break;
      case 'check':
        sendMessage("Can you check if my approach is correct?");
        break;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[420px] p-0 flex flex-col h-full"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-card">
          <TutorAvatar 
            style={preferences.avatarStyle} 
            mood={isLoading ? 'thinking' : 'idle'} 
            size="sm" 
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{preferences.tutorName}</h3>
            <p className="text-xs text-muted-foreground">
              {state.selectedLesson 
                ? `Helping with: ${state.selectedLesson.name}`
                : 'Your math tutor'
              }
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Context Banner */}
        {state.currentQuestion && (
          <div className="px-4 py-2 bg-primary/5 border-b">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>I can see your current problem. Say "I'm stuck" for help!</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <TutorAvatar 
                    style={preferences.avatarStyle} 
                    mood="idle" 
                    size="sm" 
                  />
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === 'assistant' ? (
                    <MathRenderer latex={message.content} />
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <TutorAvatar 
                  style={preferences.avatarStyle} 
                  mood="thinking" 
                  size="sm" 
                />
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {messages.length <= 2 && !isLoading && (
          <div className="px-4 pb-2">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('stuck')}
                className="text-xs"
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                I'm stuck
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('explain')}
                className="text-xs"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Explain this
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(!showCalculator)}
                className="text-xs"
              >
                <Calculator className="w-3 h-3 mr-1" />
                Calculator
              </Button>
            </div>
          </div>
        )}

        {/* Calculator */}
        <AnimatePresence>
          {showCalculator && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t overflow-hidden"
            >
              <div className="p-4">
                <MathCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-card">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about math..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
