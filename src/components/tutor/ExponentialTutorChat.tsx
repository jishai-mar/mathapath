import { useState, useCallback } from 'react';
import { Send, Lightbulb, BookOpen, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'tutor' | 'student' | 'system';
  content: string;
  type?: 'problem' | 'feedback' | 'hint' | 'explanation' | 'info';
}

interface CurrentProblem {
  problem: string;
  difficulty: string;
  solution: string;
  solutionSteps: string[];
  hint1: string;
  hint2: string;
  hint3: string;
}

interface ExponentialTutorChatProps {
  learningStyle: 'formal' | 'intuitive';
  onProblemComplete?: (correct: boolean, difficulty: string) => void;
}

export function ExponentialTutorChat({ learningStyle, onProblemComplete }: ExponentialTutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'tutor',
      content: "Hello! I'm your exponential equations tutor. I'll help you master solving equations where the variable appears in the exponent. Ready to start with a problem?",
      type: 'info'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<CurrentProblem | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [attempts, setAttempts] = useState(0);

  const addMessage = (role: Message['role'], content: string, type?: Message['type']) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      type
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const generateProblem = useCallback(async (diff: 'easy' | 'medium' | 'hard') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('exponential-tutor', {
        body: { 
          action: 'generate-problem',
          difficulty: diff,
          learningStyle
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.result) {
        const problem = data.result;
        setCurrentProblem(problem);
        setHintLevel(0);
        setAttempts(0);
        
        addMessage('tutor', `**Problem (${diff}):**\n\nSolve for x:\n\n$$${problem.problem}$$`, 'problem');
      }
    } catch (err) {
      console.error('Error generating problem:', err);
      addMessage('system', 'Sorry, I had trouble generating a problem. Let me try again...', 'info');
    } finally {
      setIsLoading(false);
    }
  }, [learningStyle]);

  const checkAnswer = async (answer: string) => {
    if (!currentProblem) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('exponential-tutor', {
        body: { 
          action: 'check-answer',
          problem: currentProblem.problem,
          studentAnswer: answer,
          learningStyle,
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.role === 'student' ? 'user' : 'assistant',
            content: m.content
          }))
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.result) {
        const result = data.result;
        
        if (result.isCorrect) {
          addMessage('tutor', `✅ ${result.feedback}\n\n${result.encouragement}`, 'feedback');
          onProblemComplete?.(true, currentProblem.difficulty);
          setCurrentProblem(null);
        } else {
          setAttempts(prev => prev + 1);
          let feedback = result.feedback;
          if (result.guidingQuestion) {
            feedback += `\n\n💭 ${result.guidingQuestion}`;
          }
          addMessage('tutor', feedback, 'feedback');
        }
      }
    } catch (err) {
      console.error('Error checking answer:', err);
      addMessage('system', 'I had trouble evaluating your answer. Please try again.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const getHint = async () => {
    if (!currentProblem) return;
    
    const hints = [currentProblem.hint1, currentProblem.hint2, currentProblem.hint3];
    if (hintLevel < hints.length) {
      const hint = hints[hintLevel];
      addMessage('tutor', `💡 **Hint ${hintLevel + 1}:** ${hint}`, 'hint');
      setHintLevel(prev => prev + 1);
    } else {
      // Get AI-generated contextual hint
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('exponential-tutor', {
          body: { 
            action: 'get-hint',
            problem: currentProblem.problem,
            learningStyle,
            conversationHistory: messages.slice(-5).map(m => ({
              role: m.role === 'student' ? 'user' : 'assistant',
              content: m.content
            }))
          }
        });

        if (error) throw error;
        
        if (data?.success && data?.result?.hint) {
          addMessage('tutor', `💡 ${data.result.hint}`, 'hint');
        }
      } catch (err) {
        console.error('Error getting hint:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const showSolution = async () => {
    if (!currentProblem) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('exponential-tutor', {
        body: { 
          action: 'explain-solution',
          problem: currentProblem.problem,
          learningStyle
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.result) {
        const solution = data.result;
        
        let explanationText = `📚 **Full Solution:**\n\n${solution.introduction}\n\n`;
        
        if (solution.steps) {
          solution.steps.forEach((step: any, idx: number) => {
            explanationText += `**Step ${idx + 1}:** ${step.action}\n`;
            explanationText += `${step.explanation}\n`;
            if (step.result) {
              explanationText += `→ $${step.result}$\n\n`;
            }
          });
        }
        
        explanationText += `\n**Answer:** $${solution.finalAnswer}$\n\n`;
        explanationText += `💡 **Key insight:** ${solution.keyInsight}`;
        
        addMessage('tutor', explanationText, 'explanation');
        onProblemComplete?.(false, currentProblem.difficulty);
        setCurrentProblem(null);
      }
    } catch (err) {
      console.error('Error getting solution:', err);
      // Fallback to stored solution
      let fallbackText = `📚 **Solution:**\n\n`;
      currentProblem.solutionSteps?.forEach((step, idx) => {
        fallbackText += `${idx + 1}. ${step}\n`;
      });
      fallbackText += `\n**Answer:** ${currentProblem.solution}`;
      addMessage('tutor', fallbackText, 'explanation');
      setCurrentProblem(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    addMessage('student', input);
    
    if (currentProblem) {
      checkAnswer(input);
    } else {
      // If no problem, treat as a request for a problem
      if (input.toLowerCase().includes('easy')) {
        setDifficulty('easy');
        generateProblem('easy');
      } else if (input.toLowerCase().includes('hard')) {
        setDifficulty('hard');
        generateProblem('hard');
      } else {
        generateProblem(difficulty);
      }
    }
    
    setInput('');
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-4 gap-4">
        {/* Difficulty selector */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <span className="text-sm text-muted-foreground">Difficulty:</span>
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <Button
              key={d}
              variant={difficulty === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty(d)}
              className="capitalize"
            >
              {d}
            </Button>
          ))}
          <div className="flex-1" />
          <Badge variant="secondary" className="capitalize">
            {learningStyle} mode
          </Badge>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'student' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-3",
                    message.role === 'student' 
                      ? "bg-primary text-primary-foreground" 
                      : message.role === 'system'
                      ? "bg-muted text-muted-foreground italic"
                      : "bg-muted",
                    message.type === 'problem' && "border-2 border-primary/20",
                    message.type === 'hint' && "border-l-4 border-yellow-500 bg-yellow-500/10",
                    message.type === 'explanation' && "border-l-4 border-green-500 bg-green-500/10"
                  )}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MathRenderer segments={createSegmentsFromSolution(message.content)} />
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action buttons when problem is active */}
        {currentProblem && !isLoading && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={getHint}>
              <Lightbulb className="h-4 w-4 mr-1" />
              Hint {hintLevel > 0 ? `(${hintLevel}/3)` : ''}
            </Button>
            <Button variant="outline" size="sm" onClick={showSolution}>
              <BookOpen className="h-4 w-4 mr-1" />
              Show Solution
            </Button>
            <Button variant="outline" size="sm" onClick={() => generateProblem(difficulty)}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Skip Problem
            </Button>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentProblem ? "Enter your answer (e.g., x = 3)" : "Type 'start' or select difficulty..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* New problem button when no problem active */}
        {!currentProblem && !isLoading && (
          <Button onClick={() => generateProblem(difficulty)} className="w-full">
            Generate New Problem
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
