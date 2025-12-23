import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import MathRenderer from './MathRenderer';
import { supabase } from '@/integrations/supabase/client';
import { Send, User, Loader2, Calculator, LineChart, Ruler, X, MessageCircle, Target, Sparkles, Image as ImageIcon } from 'lucide-react';
import ToolPanel, { ToolSuggestion, detectToolsFromTopic } from './tools/ToolPanel';
import { useTutor } from '@/contexts/TutorContext';
import { useAuth } from '@/contexts/AuthContext';
import { TutorAvatar } from './tutor/TutorAvatar';
import { cn } from '@/lib/utils';
import { useTutorSession, SessionPhase, EmotionalState, TutoringMode } from '@/contexts/TutorSessionContext';
import { useSessionNotes } from '@/hooks/useSessionNotes';
import { TutoringModeSelector } from './chat/TutoringModeSelector';
import { QuickCheckInput } from './chat/QuickCheckInput';
import { ChatImageUpload } from './chat/ChatImageUpload';
import { parseGraphDirectives, detectGraphableContent } from '@/lib/mathContentParser';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolSuggestion?: ToolSuggestion;
  phase?: SessionPhase;
  hasImage?: boolean;
}

interface TutorChatProps {
  subtopicName: string;
  theoryContext?: string;
  onClose?: () => void;
}

const chatThemeStyles = {
  default: 'from-primary/20 to-primary/10',
  warm: 'from-orange-500/20 to-amber-500/10',
  cool: 'from-blue-500/20 to-cyan-500/10',
  nature: 'from-emerald-500/20 to-green-500/10',
};

const emotionIndicators: Record<EmotionalState, { icon: string; label: string; color: string }> = {
  neutral: { icon: '😊', label: 'Ready to learn', color: 'text-muted-foreground' },
  engaged: { icon: '🤩', label: 'Engaged', color: 'text-green-500' },
  struggling: { icon: '🤔', label: 'Working through it', color: 'text-yellow-500' },
  frustrated: { icon: '😓', label: 'Needs support', color: 'text-orange-500' },
  confident: { icon: '😎', label: 'Confident', color: 'text-blue-500' },
  anxious: { icon: '😰', label: 'Feeling unsure', color: 'text-purple-500' },
};

export default function TutorChat({ subtopicName, theoryContext = '', onClose }: TutorChatProps) {
  const { preferences } = useTutor();
  const { user } = useAuth();
  const { 
    phase, 
    setPhase, 
    emotionalState, 
    setEmotionalState,
    sessionGoal,
    setSessionGoal,
    progress,
    updateProgress,
    addTopicCovered,
    startSession,
    isSessionActive,
    tutoringMode,
    setTutoringMode,
  } = useTutorSession();
  const { analyzeAndSaveFromResponse } = useSessionNotes();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentToolSuggestion, setCurrentToolSuggestion] = useState<ToolSuggestion | undefined>();
  const [isGeneratingGreeting, setIsGeneratingGreeting] = useState(false);
  const [studentName, setStudentName] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load student profile data
  useEffect(() => {
    const loadStudentData = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('first_name, display_name')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setStudentName(data.first_name || data.display_name || undefined);
      }
    };
    
    loadStudentData();
  }, [user]);

  // Initialize session with greeting
  useEffect(() => {
    if (!isSessionActive && messages.length === 0) {
      startSession(studentName);
      generateGreeting();
    }
  }, [isSessionActive, messages.length, studentName]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track topic when starting
  useEffect(() => {
    if (subtopicName) {
      addTopicCovered(subtopicName);
    }
  }, [subtopicName, addTopicCovered]);

  const generateGreeting = async () => {
    setIsGeneratingGreeting(true);
    try {
      // Fetch user stats for personalized greeting
      let currentStreak = 0;
      let totalXp = 0;
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_streak, total_xp')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          currentStreak = profile.current_streak || 0;
          totalXp = profile.total_xp || 0;
        }
      }

      const { data, error } = await supabase.functions.invoke('generate-session-greeting', {
        body: {
          studentName,
          tutorName: preferences.tutorName,
          personality: preferences.personality,
          currentStreak,
          totalXp,
          weakestSubtopic: subtopicName,
          userId: user?.id,
        }
      });

      if (error) throw error;

      const greeting = data.greeting || `Hi${studentName ? ` ${studentName}` : ''}! Great to see you. How are you feeling about math today?`;
      
      setMessages([{ 
        role: 'assistant', 
        content: greeting,
        phase: 'greeting',
      }]);
      
      // Move to goal-setting after greeting
      setTimeout(() => setPhase('goal-setting'), 500);
    } catch (error) {
      console.error('Error generating greeting:', error);
      // Fallback greeting
      setMessages([{ 
        role: 'assistant', 
        content: `Hi${studentName ? ` ${studentName}` : ''}! Great to see you. What would you like to work on today?`,
        phase: 'greeting',
      }]);
      setPhase('goal-setting');
    } finally {
      setIsGeneratingGreeting(false);
    }
  };

  // Parse AI response for tool suggestions and auto-graph directives
  const parseToolSuggestions = (content: string): ToolSuggestion => {
    const suggestion: ToolSuggestion = {};
    
    // Check for explicit graph directives [GRAPH: y=x^2]
    const graphDirectives = parseGraphDirectives(content);
    if (graphDirectives.length > 0) {
      suggestion.graph = true;
      suggestion.graphFunctions = graphDirectives.flatMap(d => d.functions);
      suggestion.message = 'View the graph';
    }
    
    // Also detect graphable content even without explicit directives
    if (!suggestion.graph) {
      const detectedFunctions = detectGraphableContent(content);
      if (detectedFunctions.length > 0) {
        suggestion.graph = true;
        suggestion.graphFunctions = detectedFunctions;
        suggestion.message = 'Visualize this function';
      }
    }
    
    // Check for other tool suggestions
    if (content.includes('📈') || content.toLowerCase().includes('try graphing') || content.toLowerCase().includes('plot')) {
      suggestion.graph = true;
      if (!suggestion.message) suggestion.message = 'Try graphing to visualize';
    }
    if (content.includes('🖩') || content.toLowerCase().includes('calculator') || content.toLowerCase().includes('compute')) {
      suggestion.calculator = true;
      suggestion.message = suggestion.message || 'Use calculator to verify';
    }
    if (content.includes('📏') || content.toLowerCase().includes('measure') || content.toLowerCase().includes('protractor')) {
      suggestion.geometry = true;
      suggestion.message = suggestion.message || 'Use measurement tools';
    }
    
    return suggestion;
  };

  // Detect if user is setting a goal
  const detectGoalSetting = (message: string): boolean => {
    const goalIndicators = [
      'want to', 'like to', 'need to', 'work on', 'practice', 'learn',
      'understand', 'master', 'focus on', 'help with', 'struggle with',
      "let's do", "let's work", 'can we', 'could we'
    ];
    return goalIndicators.some(indicator => message.toLowerCase().includes(indicator));
  };

  const sendMessage = async (userMessage: string, imageData?: string) => {
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage, 
      phase,
      hasImage: !!imageData 
    }]);
    setIsLoading(true);

    // If in goal-setting phase and user specifies a goal, extract and transition
    if (phase === 'goal-setting' && detectGoalSetting(userMessage)) {
      setSessionGoal({ description: userMessage, subtopicName });
      setTimeout(() => setPhase('learning'), 1000);
    }

    try {
      const { data, error } = await supabase.functions.invoke('ask-tutor', {
        body: {
          question: userMessage,
          subtopicName,
          theoryContext,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          tutorName: preferences.tutorName,
          personality: preferences.personality,
          sessionPhase: phase,
          sessionGoal: sessionGoal?.description,
          studentName,
          detectedEmotionalState: emotionalState,
          userId: user?.id,
          tutoringMode,
          imageData,
        }
      });

      if (error) throw error;

      const answer = data.answer || 'I apologize, but I couldn\'t generate a response. Please try again.';
      const toolSuggestion = parseToolSuggestions(answer);
      
      // Update emotional state based on AI's detection
      if (data.detectedEmotion && data.detectedEmotion !== emotionalState) {
        setEmotionalState(data.detectedEmotion);
      }
      
      setCurrentToolSuggestion(Object.keys(toolSuggestion).length > 0 ? toolSuggestion : undefined);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: answer,
        toolSuggestion: Object.keys(toolSuggestion).length > 0 ? toolSuggestion : undefined,
        phase,
      }]);

      // Track interaction
      updateProgress({ totalAttempts: progress.totalAttempts + 1 });
      
      // Analyze conversation for things worth remembering
      analyzeAndSaveFromResponse(answer, userMessage, subtopicName);
    } catch (error) {
      console.error('Error asking tutor:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again in a moment.',
        phase,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    await sendMessage(userMessage);
  };

  const handleImageSubmit = async (imageData: string, file: File) => {
    setIsUploadingImage(true);
    const userMessage = `[Uploaded image: ${file.name}] Please check my work.`;
    await sendMessage(userMessage, imageData);
    setIsUploadingImage(false);
  };

  const handleQuickCheck = async (answer: string): Promise<{ isCorrect: boolean; feedback: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('ask-tutor', {
        body: {
          question: `Quick check: Is this answer correct? "${answer}" - Just tell me yes/no and briefly why.`,
          subtopicName,
          theoryContext,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          tutorName: preferences.tutorName,
          personality: preferences.personality,
          sessionPhase: 'learning',
          tutoringMode: 'quick-check',
          userId: user?.id,
        }
      });

      if (error) throw error;

      const response = data.answer || '';
      const isCorrect = response.toLowerCase().includes('correct') && 
                        !response.toLowerCase().includes('incorrect') &&
                        !response.toLowerCase().includes('not correct');
      
      return { isCorrect, feedback: response };
    } catch (error) {
      console.error('Quick check error:', error);
      return { isCorrect: false, feedback: 'Could not verify your answer. Try asking the tutor directly.' };
    }
  };

  const handleRequestHelp = () => {
    setTutoringMode('hint');
    setInput("I got it wrong - can you help me understand where I went wrong?");
  };

  const handleToolUsed = (tool: string) => {
    console.log(`Student used ${tool} tool`);
    updateProgress({ hintsUsed: progress.hintsUsed + 1 });
  };

  const handleEndSession = async () => {
    setPhase('wrap-up');
    setIsLoading(true);

    try {
      const sessionDurationMinutes = Math.round(
        (new Date().getTime() - (new Date().getTime() - 1000 * 60 * 10)) / 60000
      ); // Placeholder - would use actual session start time

      const { data, error } = await supabase.functions.invoke('generate-session-wrapup', {
        body: {
          studentName,
          tutorName: preferences.tutorName,
          personality: preferences.personality,
          sessionGoal: sessionGoal?.description,
          progress,
          sessionDurationMinutes,
        }
      });

      if (error) throw error;

      const wrapup = data.wrapup || `Great work today${studentName ? `, ${studentName}` : ''}! You made real progress. See you next time!`;
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: wrapup,
        phase: 'wrap-up',
      }]);
    } catch (error) {
      console.error('Error generating wrap-up:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Great session${studentName ? `, ${studentName}` : ''}! You worked hard today. Keep it up!`,
        phase: 'wrap-up',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const emotionInfo = emotionIndicators[emotionalState];

  return (
    <div className={cn(
      "relative",
      onClose && "fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] shadow-2xl rounded-2xl"
    )}>
      <Card className="border-border/50 bg-card/95 backdrop-blur-xl">
        <CardContent className="p-4 space-y-4">
          {/* Tutor header with session info */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/30">
            <TutorAvatar style={preferences.avatarStyle} mood="idle" size="sm" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{preferences.tutorName}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {phase === 'greeting' && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Getting started</span>}
                {phase === 'goal-setting' && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Setting goals</span>}
                {phase === 'learning' && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Learning</span>}
                {phase === 'wrap-up' && <span className="flex items-center gap-1">✨ Wrapping up</span>}
              </div>
            </div>
            <div className="flex gap-1 items-center">
              {/* Emotion indicator */}
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1", emotionInfo.color)} title={emotionInfo.label}>
                {emotionInfo.icon}
              </span>
              
              {detectToolsFromTopic(subtopicName).calculator && (
                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 rounded-full flex items-center gap-0.5">
                  <Calculator className="w-2.5 h-2.5" />
                </span>
              )}
              {detectToolsFromTopic(subtopicName).graph && (
                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 rounded-full flex items-center gap-0.5">
                  <LineChart className="w-2.5 h-2.5" />
                </span>
              )}
              {detectToolsFromTopic(subtopicName).geometry && (
                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 rounded-full flex items-center gap-0.5">
                  <Ruler className="w-2.5 h-2.5" />
                </span>
              )}
              {onClose && (
                <button 
                  onClick={onClose}
                  className="ml-2 p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Tutoring mode selector - only show during learning phase */}
          {phase === 'learning' && (
            <TutoringModeSelector
              mode={tutoringMode}
              onModeChange={setTutoringMode}
              disabled={isLoading}
            />
          )}

          {/* Session goal indicator */}
          {sessionGoal && phase === 'learning' && (
            <div className="px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 text-xs">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">Goal:</span>
                <span className="font-medium truncate">{sessionGoal.description}</span>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <ScrollArea className="h-64 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {isGeneratingGreeting && messages.length === 0 && (
                <div className="text-center py-8">
                  <TutorAvatar style={preferences.avatarStyle} mood="thinking" size="lg" className="mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground animate-pulse">
                    {preferences.tutorName} is preparing to greet you...
                  </p>
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
                    <TutorAvatar 
                      style={preferences.avatarStyle} 
                      mood={idx === messages.length - 1 ? 'explaining' : 'idle'} 
                      size="sm" 
                      className="flex-shrink-0"
                    />
                  )}
                  <div className="max-w-[80%] space-y-2">
                    <div
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : `bg-gradient-to-br ${chatThemeStyles[preferences.chatTheme]}`
                      )}
                    >
                      {message.hasImage && (
                        <div className="flex items-center gap-1.5 mb-2 text-xs opacity-80">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Uploaded work</span>
                        </div>
                      )}
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
                  <TutorAvatar style={preferences.avatarStyle} mood="thinking" size="sm" />
                  <div className={cn("p-3 rounded-lg bg-gradient-to-br", chatThemeStyles[preferences.chatTheme])}>
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Check Input - only show in quick-check mode */}
          {tutoringMode === 'quick-check' && phase === 'learning' && (
            <QuickCheckInput
              onCheck={handleQuickCheck}
              onRequestHelp={handleRequestHelp}
              disabled={isLoading}
            />
          )}

          {/* Input and controls */}
          {tutoringMode !== 'quick-check' && (
            <div className="space-y-2">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <ChatImageUpload
                  onImageSubmit={handleImageSubmit}
                  isUploading={isUploadingImage}
                  disabled={isLoading || isGeneratingGreeting}
                />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    phase === 'greeting' ? "Share how you're feeling..." :
                    phase === 'goal-setting' ? "What would you like to work on?" :
                    phase === 'wrap-up' ? "Any final questions?" :
                    tutoringMode === 'hint' ? "Ask for a hint..." :
                    tutoringMode === 'solution' ? "Ask to see the solution..." :
                    "Ask a question about this topic..."
                  }
                  className="flex-1 bg-secondary/30 border-border/50"
                  disabled={isLoading || isGeneratingGreeting}
                />
                <Button type="submit" size="icon" disabled={!input.trim() || isLoading || isGeneratingGreeting}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              
              {/* End session button - only show during learning phase */}
              {phase === 'learning' && messages.length > 4 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={handleEndSession}
                  disabled={isLoading}
                >
                  End Session & Get Summary
                </Button>
              )}
            </div>
          )}
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
