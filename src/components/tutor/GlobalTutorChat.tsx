import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, HelpCircle, BookOpen, Calculator, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useTutor } from '@/contexts/TutorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
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
  "why is this wrong",
  "what's wrong",
  "explain this",
  "help with this",
];

export function GlobalTutorChat({ isOpen, onClose }: GlobalTutorChatProps) {
  const { preferences } = useTutor();
  const { user } = useAuth();
  const exerciseContext = useExerciseContext();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Derived state from exercise context
  const hasActiveExercise = exerciseContext?.hasActiveExercise?.() ?? false;
  const currentQuestion = exerciseContext?.questionText;
  const lessonName = exerciseContext?.lessonName;
  const topicName = exerciseContext?.topicName;

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
    let greeting = `Hi! I'm ${preferences.tutorName}, your math tutor. `;
    
    if (hasActiveExercise && currentQuestion) {
      if (lessonName) {
        greeting += `I see you're working on "${lessonName}". `;
      }
      greeting += `I can see the problem on your screen right now. Just say "I'm stuck" or ask me anything - I can see exactly what you're looking at!`;
    } else if (topicName || lessonName) {
      greeting += `I see you're studying ${topicName || lessonName}. How can I help you?`;
    } else {
      greeting += `What would you like to work on today? I can help you with any math topic. If you're working on a problem, I'll be able to see it automatically!`;
    }
    
    setMessages([{ role: 'assistant', content: greeting }]);
  };

  const detectStuckRequest = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    return STUCK_PHRASES.some(phrase => lowerMessage.includes(phrase));
  };

  const buildContextAwarePrompt = (userMessage: string): string => {
    // Always get the full exercise context if available
    const fullContext = exerciseContext?.getFullContextForTutor?.() || '';
    const isStuckRequest = detectStuckRequest(userMessage);
    
    let prompt = userMessage;
    
    if (hasActiveExercise && currentQuestion) {
      if (isStuckRequest) {
        // User is explicitly asking for help with what's on screen
        prompt = `The student says: "${userMessage}"

CRITICAL CONTEXT - You can see EXACTLY what the student is working on:

${fullContext}

YOUR TASK:
1. Acknowledge the specific problem and part they're working on
2. Look at their current answer attempt and identify any misconceptions
3. Start by briefly restating what you see: "I see you're working on [problem description]..."
4. If their answer shows a pattern of error, explain what concept they might be missing
5. Guide them step-by-step WITHOUT giving away the final answer
6. Use the Socratic method - ask questions that lead them to discover the solution
7. If they've made a specific calculation error, point to WHERE the error is, not WHAT the answer should be

Remember: You're sitting right next to this student, looking at their screen. Be specific and direct about what you see.`;
      } else {
        // Regular question but still provide context
        prompt = `Student's question: "${userMessage}"

CONTEXT (What the student is currently viewing on their screen):
${fullContext}

Respond helpfully, being aware of what they're working on. If their question relates to the current exercise, reference it directly. Don't ask them to paste or describe the problem - you can already see it.`;
      }
    } else if (isStuckRequest) {
      // User says they're stuck but no exercise is active
      prompt = `The student says: "${userMessage}"

NOTE: The student seems to be asking for help, but they're not currently on an exercise screen. 

Please:
1. Acknowledge their request
2. Ask what topic or problem they'd like help with
3. Offer to help if they navigate to an exercise, or if they can describe what they're working on`;
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
          subtopicName: lessonName || topicName || 'General Math',
          theoryContext: '',
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
      
      // Add to conversation history in exercise context
      exerciseContext?.addConversationMessage?.('student', userMessage);
      exerciseContext?.addConversationMessage?.('tutor', answer);
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
        sendMessage("I'm stuck on this problem. Can you help me understand what to do?");
        break;
      case 'explain':
        sendMessage("Can you explain the concept behind this step-by-step?");
        break;
      case 'check':
        sendMessage("Can you check if my approach is correct so far?");
        break;
      case 'hint':
        sendMessage("Can you give me a hint without telling me the answer?");
        break;
    }
  };

  // Get current part info for display
  const activePartInfo = exerciseContext?.subparts?.[exerciseContext.activeSubpartIndex];
  const currentUserAnswer = activePartInfo?.userAnswer;

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
              {lessonName 
                ? `Helping with: ${lessonName}`
                : topicName
                  ? `Topic: ${topicName}`
                  : 'Your math tutor'
              }
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Context Banner - Shows when exercise is active */}
        {hasActiveExercise && (
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
            <div className="flex items-center gap-2 text-xs">
              <Eye className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                I can see your current problem
              </span>
            </div>
            {activePartInfo && (
              <p className="text-xs text-muted-foreground mt-1 pl-5">
                Working on part ({activePartInfo.label})
                {currentUserAnswer && ` • Your answer: "${currentUserAnswer}"`}
              </p>
            )}
          </div>
        )}

        {/* No Exercise Banner */}
        {!hasActiveExercise && (
          <div className="px-4 py-2 bg-muted/50 border-b">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              <span>Navigate to an exercise and I'll be able to see it!</span>
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
                    <span className="text-sm">Looking at your work...</span>
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
                onClick={() => handleQuickAction('hint')}
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Give me a hint
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
              placeholder={hasActiveExercise ? "Ask about this problem..." : "Ask me anything about math..."}
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
