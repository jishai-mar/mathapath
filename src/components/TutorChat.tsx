import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import MathRenderer from './MathRenderer';
import { supabase } from '@/integrations/supabase/client';
import { Send, Bot, User, Loader2, Calculator, LineChart, Ruler } from 'lucide-react';
import ToolPanel, { ToolSuggestion, detectToolsFromTopic } from './tools/ToolPanel';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolSuggestion?: ToolSuggestion;
}

interface TutorChatProps {
  subtopicName: string;
  theoryContext: string;
}

export default function TutorChat({ subtopicName, theoryContext }: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentToolSuggestion, setCurrentToolSuggestion] = useState<ToolSuggestion | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Parse AI response for tool suggestions
  const parseToolSuggestions = (content: string): ToolSuggestion => {
    const suggestion: ToolSuggestion = {};
    
    // Detect tool markers in response
    if (content.includes('📈') || content.toLowerCase().includes('try graphing') || content.toLowerCase().includes('plot')) {
      suggestion.graph = true;
      suggestion.message = 'Try graphing to visualize';
    }
    if (content.includes('🖩') || content.toLowerCase().includes('calculator') || content.toLowerCase().includes('compute')) {
      suggestion.calculator = true;
      suggestion.message = 'Use calculator to verify';
    }
    if (content.includes('📏') || content.toLowerCase().includes('measure') || content.toLowerCase().includes('protractor')) {
      suggestion.geometry = true;
      suggestion.message = 'Use measurement tools';
    }
    
    return suggestion;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ask-tutor', {
        body: {
          question: userMessage,
          subtopicName,
          theoryContext,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }
      });

      if (error) throw error;

      const answer = data.answer || 'I apologize, but I couldn\'t generate a response. Please try again.';
      const toolSuggestion = parseToolSuggestions(answer);
      
      setCurrentToolSuggestion(Object.keys(toolSuggestion).length > 0 ? toolSuggestion : undefined);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: answer,
        toolSuggestion: Object.keys(toolSuggestion).length > 0 ? toolSuggestion : undefined
      }]);
    } catch (error) {
      console.error('Error asking tutor:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again in a moment.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolUsed = (tool: string) => {
    console.log(`Student used ${tool} tool`);
  };

  return (
    <div className="relative">
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4 space-y-4">
          {/* Tools indicator */}
          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground">Tools available:</span>
            <div className="flex gap-1">
              {detectToolsFromTopic(subtopicName).calculator && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 rounded-full flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Calculator
                </span>
              )}
              {detectToolsFromTopic(subtopicName).graph && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 rounded-full flex items-center gap-1">
                  <LineChart className="w-3 h-3" /> Graph
                </span>
              )}
              {detectToolsFromTopic(subtopicName).geometry && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 rounded-full flex items-center gap-1">
                  <Ruler className="w-3 h-3" /> Measure
                </span>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="h-64 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Ask me anything about <strong>{subtopicName}</strong>!</p>
                  <p className="text-xs mt-1 opacity-70">I'll guide you with hints and suggest tools to help explore.</p>
                </div>
              )}
              
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 animate-fade-in ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="max-w-[80%] space-y-2">
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50'
                      }`}
                    >
                      <MathRenderer latex={message.content} />
                    </div>
                    
                    {/* Tool suggestion badge */}
                    {message.toolSuggestion && message.role === 'assistant' && (
                      <div className="flex gap-1 flex-wrap">
                        {message.toolSuggestion.calculator && (
                          <span className="text-[10px] px-2 py-0.5 bg-accent/20 rounded-full flex items-center gap-1 text-accent-foreground">
                            <Calculator className="w-3 h-3" /> Try the calculator
                          </span>
                        )}
                        {message.toolSuggestion.graph && (
                          <span className="text-[10px] px-2 py-0.5 bg-accent/20 rounded-full flex items-center gap-1 text-accent-foreground">
                            <LineChart className="w-3 h-3" /> Graph this
                          </span>
                        )}
                        {message.toolSuggestion.geometry && (
                          <span className="text-[10px] px-2 py-0.5 bg-accent/20 rounded-full flex items-center gap-1 text-accent-foreground">
                            <Ruler className="w-3 h-3" /> Measure it
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this topic..."
              className="flex-1 bg-secondary/30 border-border/50"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tool Panel */}
      <ToolPanel 
        subtopicName={subtopicName} 
        suggestion={currentToolSuggestion}
        onToolUsed={handleToolUsed}
      />
    </div>
  );
}
