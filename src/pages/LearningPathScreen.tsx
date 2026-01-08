import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  Play, 
  Star,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  name: string;
  order_index: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  masteryPercentage: number;
}

interface TopicData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
}

export default function LearningPathScreen() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (topicId) {
      loadTopicAndLessons();
    }
  }, [topicId, user]);

  const loadTopicAndLessons = async () => {
    setIsLoading(true);
    try {
      // Fetch topic
      const { data: topicData } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();
      
      if (topicData) setTopic(topicData);

      // Fetch subtopics (lessons)
      const { data: subtopicsData } = await supabase
        .from('subtopics')
        .select('*')
        .eq('topic_id', topicId)
        .order('order_index');

      // Fetch user progress for these subtopics
      let progressMap = new Map<string, number>();
      if (user) {
        const { data: progressData } = await supabase
          .from('user_subtopic_progress')
          .select('subtopic_id, mastery_percentage')
          .eq('user_id', user.id)
          .in('subtopic_id', (subtopicsData || []).map(s => s.id));
        
        (progressData || []).forEach(p => {
          progressMap.set(p.subtopic_id, p.mastery_percentage);
        });
      }

      // Build lessons with unlock logic
      const builtLessons: Lesson[] = (subtopicsData || []).map((subtopic, index) => {
        const mastery = progressMap.get(subtopic.id) || 0;
        const isCompleted = mastery >= 80;
        
        // First lesson always unlocked, others unlocked if previous is completed
        let isUnlocked = index === 0;
        if (index > 0) {
          const prevSubtopicId = subtopicsData[index - 1].id;
          const prevMastery = progressMap.get(prevSubtopicId) || 0;
          isUnlocked = prevMastery >= 80;
        }
        
        return {
          id: subtopic.id,
          name: subtopic.name,
          order_index: subtopic.order_index,
          isCompleted,
          isUnlocked,
          masteryPercentage: mastery,
        };
      });

      setLessons(builtLessons);
      
      // Auto-select first unlocked incomplete lesson
      const nextLesson = builtLessons.find(l => l.isUnlocked && !l.isCompleted) || builtLessons[0];
      if (nextLesson) setSelectedLesson(nextLesson);
      
    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLesson = () => {
    if (selectedLesson && topic) {
      navigate(`/lesson/${topic.id}/${selectedLesson.id}`);
    }
  };

  const getNodePosition = (index: number, total: number) => {
    // Zig-zag pattern: alternate left and right
    const isEven = index % 2 === 0;
    const baseOffset = 60; // px from center
    const xOffset = isEven ? -baseOffset : baseOffset;
    return { xOffset };
  };

  const getSelectedNodePosition = () => {
    if (!selectedLesson) return { top: 0, left: 0 };
    const node = nodeRefs.current.get(selectedLesson.id);
    const container = containerRef.current;
    if (!node || !container) return { top: 0, left: 0 };
    
    const nodeRect = node.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    return {
      top: nodeRect.top - containerRect.top + nodeRect.height / 2 - 60,
      left: nodeRect.left - containerRect.left + nodeRect.width + 20,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const panelPos = getSelectedNodePosition();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 30% 20%, hsla(239, 84%, 67%, 0.08) 0%, transparent 30%), radial-gradient(circle at 70% 80%, hsla(160, 84%, 39%, 0.05) 0%, transparent 30%)'
      }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{topic?.name || 'Learning Path'}</h1>
            <p className="text-sm text-muted-foreground">
              {lessons.filter(l => l.isCompleted).length} of {lessons.length} lessons completed
            </p>
          </div>
        </div>
      </header>

      {/* Main content with path */}
      <main className="max-w-4xl mx-auto px-6 py-10 relative" ref={containerRef}>
        <div className="flex">
          {/* Path column - centered left */}
          <div className="flex-1 flex flex-col items-center relative">
            {/* Connecting line (SVG) */}
            <svg 
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-40 pointer-events-none"
              style={{ zIndex: 0 }}
            >
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {lessons.map((lesson, index) => {
                if (index === 0) return null;
                const prev = getNodePosition(index - 1, lessons.length);
                const curr = getNodePosition(index, lessons.length);
                const prevX = 80 + prev.xOffset;
                const currX = 80 + curr.xOffset;
                const prevY = (index - 1) * 120 + 40;
                const currY = index * 120 + 40;
                
                const isCompleted = lessons[index - 1].isCompleted;
                
                return (
                  <path
                    key={`line-${index}`}
                    d={`M ${prevX} ${prevY} Q ${(prevX + currX) / 2} ${(prevY + currY) / 2} ${currX} ${currY}`}
                    fill="none"
                    stroke={isCompleted ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={isCompleted ? "none" : "8 8"}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            {/* Lesson nodes */}
            <div className="relative z-10 flex flex-col gap-[80px] py-8">
              {lessons.map((lesson, index) => {
                const { xOffset } = getNodePosition(index, lessons.length);
                const isSelected = selectedLesson?.id === lesson.id;
                
                return (
                  <motion.button
                    key={lesson.id}
                    ref={(el) => {
                      if (el) nodeRefs.current.set(lesson.id, el);
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => lesson.isUnlocked && setSelectedLesson(lesson)}
                    disabled={!lesson.isUnlocked}
                    style={{ marginLeft: xOffset }}
                    className={cn(
                      "relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                      "border-4 shadow-lg",
                      lesson.isCompleted
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30"
                        : lesson.isUnlocked
                          ? isSelected
                            ? "bg-primary border-primary text-primary-foreground shadow-primary/40 ring-4 ring-primary/30 scale-110"
                            : "bg-card border-primary/50 text-primary hover:scale-105 hover:border-primary cursor-pointer"
                          : "bg-muted border-muted-foreground/30 text-muted-foreground cursor-not-allowed opacity-60"
                    )}
                  >
                    {lesson.isCompleted ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : lesson.isUnlocked ? (
                      <span className="text-lg font-bold">{index + 1}</span>
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                    
                    {/* Stars for completed */}
                    {lesson.isCompleted && (
                      <div className="absolute -bottom-1 flex gap-0.5">
                        {[1, 2, 3].map((star) => (
                          <Star 
                            key={star} 
                            className={cn(
                              "w-3 h-3",
                              lesson.masteryPercentage >= star * 33 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-muted-foreground/30"
                            )} 
                          />
                        ))}
                      </div>
                    )}

                    {/* Glow effect for selected */}
                    {isSelected && lesson.isUnlocked && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary/20"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Side panel area - takes up right side */}
          <div className="w-64 relative">
            <AnimatePresence mode="wait">
              {selectedLesson && (
                <motion.div
                  key={selectedLesson.id}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  style={{ 
                    position: 'absolute',
                    top: panelPos.top,
                  }}
                  className="w-full bg-card border border-border rounded-2xl p-5 shadow-xl"
                >
                  {/* Arrow pointing to node */}
                  <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-border" />
                  <div className="absolute left-0 top-1/2 -translate-x-[6px] -translate-y-1/2 w-0 h-0 border-t-7 border-b-7 border-r-7 border-transparent border-r-card" />
                  
                  {/* Content */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedLesson.isCompleted 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-primary/20 text-primary"
                    )}>
                      {selectedLesson.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-tight">
                        {selectedLesson.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lesson {lessons.findIndex(l => l.id === selectedLesson.id) + 1}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar if started */}
                  {selectedLesson.masteryPercentage > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Mastery</span>
                        <span className={cn(
                          "font-medium",
                          selectedLesson.isCompleted ? "text-emerald-400" : "text-primary"
                        )}>
                          {selectedLesson.masteryPercentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            selectedLesson.isCompleted 
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                              : "bg-gradient-to-r from-primary to-primary/80"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedLesson.masteryPercentage}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleStartLesson}
                    className="w-full gap-2"
                    size="sm"
                  >
                    <Play className="w-4 h-4" />
                    {selectedLesson.isCompleted ? 'Practice Again' : selectedLesson.masteryPercentage > 0 ? 'Continue' : 'Start'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
