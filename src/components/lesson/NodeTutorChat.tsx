import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { Send, Loader2, MessageCircle, Calculator, BookOpen, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MathCalculator from '@/components/tools/MathCalculator';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface NodeTutorChatProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonName: string;
  lessonIndex: number;
  topicName?: string;
  theoryContent?: string | null;
}

const QUICK_QUESTIONS = [
  { icon: Lightbulb, text: "Explain this step by step" },
  { icon: BookOpen, text: "Give me an example" },
  { icon: Calculator, text: "Help me solve a problem" },
];

export function NodeTutorChat({ 
  isOpen, 
  onClose, 
  lessonId, 
  lessonName, 
  lessonIndex,
  topicName,
  theoryContent
}: NodeTutorChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm here to help you understand **${lessonName}**. 

Ask me anything about this lesson – I'll explain concepts, work through examples, or help you solve problems step by step.

What would you like to know?`
      }]);
    }
  }, [isOpen, lessonName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setInput('');
    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ask-tutor', {
        body: {
          question: text,
          subtopicName: lessonName,
          theoryContext: theoryContent || `Lesson ${lessonIndex + 1} of ${topicName}: ${lessonName}`,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          nodeSpecific: true,
          lessonContext: {
            lessonId,
            lessonIndex,
            topicName,
            lessonName
          }
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data?.response || "I can help explain this concept. Could you be more specific about what you'd like to understand?"
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error asking tutor:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble responding right now. Let me try to help another way – could you rephrase your question?"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg">Ask About This Step</SheetTitle>
                  <p className="text-sm text-muted-foreground">{lessonName}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(true)}
                className="gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculator
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MathRenderer segments={createSegmentsFromSolution(message.content)} />
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="p-4 border-t bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => handleQuickQuestion(q.text)}
                  >
                    <q.icon className="w-3 h-3" />
                    {q.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about this lesson..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={() => sendMessage()} 
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Calculator modal */}
      <MathCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onInsertResult={(result) => {
          setInput(prev => prev + result);
          setShowCalculator(false);
        }}
      />
    </>
  );
}
