import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Play, 
  Star,
  Sparkles,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DATABASE_ID_TO_SLUG } from '@/data/topicDatabaseMapping';

interface Lesson {
  id: string;
  name: string;
  order_index: number;
  isCompleted: boolean;
  isRecommended: boolean;
  isAdvanced: boolean;
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
    if (topicId && user) {
      checkAssessmentAndLoad();
    }
  }, [topicId, user]);

  // Check if assessment is completed before allowing access to learning path
  const checkAssessmentAndLoad = async () => {
    try {
      const { data: diagnosticTest } = await supabase
        .from('diagnostic_tests')
        .select('status')
        .eq('user_id', user!.id)
        .eq('topic_id', topicId)
        .single();

      if (!diagnosticTest || diagnosticTest.status !== 'completed') {
        // Redirect to assessment if not completed
        navigate(`/diagnostic/${topicId}`, { replace: true });
        return;
      }

      // Assessment completed, load the learning path
      loadTopicAndLessons();
    } catch (error) {
      // No diagnostic found, redirect to assessment
      navigate(`/diagnostic/${topicId}`, { replace: true });
    }
  };

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

      // Build lessons - all accessible, but mark advanced ones
      const builtLessons: Lesson[] = (subtopicsData || []).map((subtopic, index) => {
        const mastery = progressMap.get(subtopic.id) || 0;
        const isCompleted = mastery >= 80;
        
        // Check if all previous lessons are completed
        let allPreviousCompleted = true;
        for (let i = 0; i < index; i++) {
          const prevId = subtopicsData[i].id;
          const prevMastery = progressMap.get(prevId) || 0;
          if (prevMastery < 80) {
            allPreviousCompleted = false;
            break;
          }
        }
        
        // Find the first incomplete lesson to recommend
        const isRecommended = index === 0 || allPreviousCompleted;
        const isAdvanced = !allPreviousCompleted && index > 0;
        
        return {
          id: subtopic.id,
          name: subtopic.name,
          order_index: subtopic.order_index,
          isCompleted,
          isRecommended,
          isAdvanced,
          masteryPercentage: mastery,
        };
      });

      setLessons(builtLessons);
      
      // Auto-select first incomplete lesson or first lesson
      const nextLesson = builtLessons.find(l => !l.isCompleted && l.isRecommended) 
        || builtLessons.find(l => !l.isCompleted) 
        || builtLessons[0];
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

  // Calculate node positions for the zig-zag path
  const NODE_SPACING = 100; // Vertical spacing between nodes
  const ZIGZAG_OFFSET = 50; // Horizontal offset for zig-zag
  const NODE_SIZE = 64; // Node diameter
  const CENTER_X = 80; // Center of the path area

  const getNodePosition = (index: number) => {
    const isEven = index % 2 === 0;
    const x = CENTER_X + (isEven ? -ZIGZAG_OFFSET : ZIGZAG_OFFSET);
    const y = index * NODE_SPACING + NODE_SIZE / 2;
    return { x, y };
  };

  const getSelectedNodePosition = () => {
    if (!selectedLesson) return { top: 0 };
    const index = lessons.findIndex(l => l.id === selectedLesson.id);
    const { y } = getNodePosition(index);
    return { top: y - 60 }; // Center panel with node
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
  const pathHeight = lessons.length * NODE_SPACING + NODE_SIZE;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.08) 0%, transparent 30%), radial-gradient(circle at 70% 80%, hsl(var(--accent) / 0.05) 0%, transparent 30%)'
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
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">{topic?.name || 'Learning Path'}</h1>
            <p className="text-sm text-muted-foreground">
              {lessons.filter(l => l.isCompleted).length} of {lessons.length} lessons completed
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const slug = topicId ? DATABASE_ID_TO_SLUG[topicId] : null;
              if (slug) {
                navigate(`/theory/${slug}`);
              } else {
                navigate(`/topic-theory/${topicId}`);
              }
            }}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Topic Theory</span>
          </Button>
        </div>
      </header>

      {/* Main content with path */}
      <main className="max-w-4xl mx-auto px-6 py-10 relative" ref={containerRef}>
        <div className="flex">
          {/* Path column */}
          <div className="flex-1 flex flex-col items-center relative" style={{ minHeight: pathHeight }}>
            {/* SVG connecting lines - aligned precisely with nodes */}
            <svg 
              className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
              width="200"
              height={pathHeight}
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
                
                const prev = getNodePosition(index - 1);
                const curr = getNodePosition(index);
                
                // Offset for SVG coordinate system (centered at 100)
                const svgCenterOffset = 100 - CENTER_X;
                const prevX = prev.x + svgCenterOffset;
                const currX = curr.x + svgCenterOffset;
                
                const isCompleted = lessons[index - 1].isCompleted;
                
                // Use quadratic bezier for smooth curves
                const midY = (prev.y + curr.y) / 2;
                
                return (
                  <path
                    key={`line-${index}`}
                    d={`M ${prevX} ${prev.y} Q ${prevX} ${midY} ${currX} ${curr.y}`}
                    fill="none"
                    stroke={isCompleted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={isCompleted ? "none" : "8 8"}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            {/* Lesson nodes */}
            <div className="relative z-10 w-full" style={{ height: pathHeight }}>
              {lessons.map((lesson, index) => {
                const { x, y } = getNodePosition(index);
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
                    onClick={() => setSelectedLesson(lesson)}
                    style={{ 
                      position: 'absolute',
                      left: `calc(50% + ${x - CENTER_X}px - ${NODE_SIZE / 2}px)`,
                      top: y - NODE_SIZE / 2,
                      width: NODE_SIZE,
                      height: NODE_SIZE,
                    }}
                    className={cn(
                      "rounded-full flex items-center justify-center transition-all duration-300",
                      "border-4 shadow-lg cursor-pointer",
                      lesson.isCompleted
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30"
                        : lesson.isAdvanced
                          ? isSelected
                            ? "bg-amber-500/20 border-amber-400 text-amber-400 shadow-amber-400/30 ring-4 ring-amber-400/30 scale-110"
                            : "bg-card border-amber-400/50 text-amber-500 hover:scale-105 hover:border-amber-400"
                          : isSelected
                            ? "bg-primary border-primary text-primary-foreground shadow-primary/40 ring-4 ring-primary/30 scale-110"
                            : "bg-card border-primary/50 text-primary hover:scale-105 hover:border-primary"
                    )}
                  >
                    {lesson.isCompleted ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : lesson.isAdvanced ? (
                      <span className="text-lg font-bold">{index + 1}</span>
                    ) : (
                      <span className="text-lg font-bold">{index + 1}</span>
                    )}
                    
                    {/* Advanced indicator */}
                    {lesson.isAdvanced && !lesson.isCompleted && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
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
                    {isSelected && (
                      <motion.div
                        className={cn(
                          "absolute inset-0 rounded-full",
                          lesson.isAdvanced ? "bg-amber-400/20" : "bg-primary/20"
                        )}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Side panel area */}
          <div className="w-72 relative ml-4">
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
                  className={cn(
                    "w-full border rounded-2xl p-5 shadow-xl",
                    selectedLesson.isAdvanced && !selectedLesson.isCompleted
                      ? "bg-card border-amber-400/50"
                      : "bg-card border-border"
                  )}
                >
                  {/* Arrow pointing to node */}
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent",
                    selectedLesson.isAdvanced && !selectedLesson.isCompleted
                      ? "border-r-amber-400/50"
                      : "border-r-border"
                  )} />
                  
                  {/* Advanced warning banner */}
                  {selectedLesson.isAdvanced && !selectedLesson.isCompleted && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium">Advanced - earlier lessons recommended</span>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedLesson.isCompleted 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : selectedLesson.isAdvanced
                          ? "bg-amber-500/20 text-amber-400"
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
                    className={cn(
                      "w-full gap-2",
                      selectedLesson.isAdvanced && !selectedLesson.isCompleted
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : ""
                    )}
                    size="sm"
                  >
                    <Play className="w-4 h-4" />
                    {selectedLesson.isCompleted 
                      ? 'Practice Again' 
                      : selectedLesson.masteryPercentage > 0 
                        ? 'Continue' 
                        : 'Start'}
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
