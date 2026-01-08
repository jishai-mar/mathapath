import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import AnimatedMathVideo from '@/components/AnimatedMathVideo';
import { cn } from '@/lib/utils';

interface SubtopicData {
  id: string;
  name: string;
  theory_explanation: string | null;
  worked_examples: any[];
  topic_id: string;
}

interface TopicData {
  id: string;
  name: string;
}

interface ProgressData {
  easy_mastered: boolean;
  medium_mastered: boolean;
  hard_mastered: boolean;
  mastery_percentage: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

// Generate AI explanation steps based on lesson content
function generateLessonExplanation(lessonName: string, theoryContent: string | null): any[] {
  const steps: any[] = [];
  
  // Welcome step
  steps.push({
    type: 'title',
    content: lessonName,
    duration: 3500,
    voiceover: `Welcome! Today we'll learn about ${lessonName}.`
  });

  // Introduction
  steps.push({
    type: 'text',
    content: `Let's build a solid understanding of ${lessonName} step by step. Take your time with each concept.`,
    duration: 4500,
    voiceover: `We'll build understanding step by step.`
  });

  // If we have theory content, parse it into steps
  if (theoryContent) {
    const paragraphs = theoryContent.split('\n\n').filter(p => p.trim());
    
    paragraphs.slice(0, 5).forEach((paragraph, i) => {
      const cleanParagraph = paragraph.replace(/\*\*/g, '').trim();
      
      if (cleanParagraph.includes('=') || cleanParagraph.includes('\\frac')) {
        steps.push({
          type: 'equation',
          content: cleanParagraph,
          duration: 5500,
          highlight: 'true',
          voiceover: `Here's an important formula.`
        });
      } else if (cleanParagraph.toLowerCase().includes('key') || 
                 cleanParagraph.toLowerCase().includes('important') ||
                 cleanParagraph.toLowerCase().includes('remember')) {
        steps.push({
          type: 'highlight',
          content: cleanParagraph,
          duration: 6000,
          voiceover: `This is important: ${cleanParagraph.substring(0, 100)}...`
        });
      } else {
        steps.push({
          type: 'text',
          content: cleanParagraph,
          duration: 4500,
          voiceover: cleanParagraph.substring(0, 150)
        });
      }
    });
  } else {
    // Generate generic helpful content for the lesson
    steps.push({
      type: 'text',
      content: `Understanding ${lessonName} is an important skill. Let's explore the key concepts together.`,
      duration: 4500,
      voiceover: `Understanding this concept is important.`
    });

    steps.push({
      type: 'highlight',
      content: `The goal is to understand the underlying principles, not just memorize formulas. Practice will help solidify your knowledge.`,
      duration: 5500,
      voiceover: `Focus on understanding, not just memorization.`
    });
  }

  // Summary step
  steps.push({
    type: 'transition',
    content: '',
    duration: 2000
  });

  steps.push({
    type: 'text',
    content: `Great job! Now try the practice exercises to test your understanding. Start with Easy to build confidence.`,
    duration: 4500,
    voiceover: `Now practice what you've learned!`
  });

  return steps;
}

export default function LessonScreen() {
  const { topicId, lessonId } = useParams<{ topicId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [lesson, setLesson] = useState<SubtopicData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [lessonIndex, setLessonIndex] = useState<number>(0);
  const [totalLessons, setTotalLessons] = useState<number>(1);

  useEffect(() => {
    if (topicId && lessonId) {
      loadLessonData();
    }
  }, [topicId, lessonId, user]);

  const loadLessonData = async () => {
    setIsLoading(true);
    try {
      // Fetch topic
      const { data: topicData } = await supabase
        .from('topics')
        .select('id, name')
        .eq('id', topicId)
        .single();
      
      if (topicData) setTopic(topicData);

      // Fetch subtopic (lesson)
      const { data: subtopicData } = await supabase
        .from('subtopics')
        .select('id, name, theory_explanation, worked_examples, topic_id')
        .eq('id', lessonId)
        .single();
      
      if (subtopicData) {
        setLesson({
          ...subtopicData,
          worked_examples: Array.isArray(subtopicData.worked_examples) 
            ? subtopicData.worked_examples 
            : []
        });
      }

      // Get lesson position in topic
      const { data: allLessons } = await supabase
        .from('subtopics')
        .select('id')
        .eq('topic_id', topicId)
        .order('order_index');
      
      if (allLessons) {
        setTotalLessons(allLessons.length);
        const idx = allLessons.findIndex(l => l.id === lessonId);
        setLessonIndex(idx >= 0 ? idx : 0);
      }

      // Fetch user progress if logged in
      if (user && lessonId) {
        const { data: progressData } = await supabase
          .from('user_subtopic_progress')
          .select('easy_mastered, medium_mastered, hard_mastered, mastery_percentage')
          .eq('user_id', user.id)
          .eq('subtopic_id', lessonId)
          .maybeSingle();
        
        if (progressData) {
          setProgress(progressData);
        }
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (topicId) {
      navigate(`/learning-path/${topicId}`);
    } else {
      navigate('/');
    }
  };

  const handleTheory = () => {
    if (lessonId && topicId) {
      navigate(`/theory/${topicId}?subtopic=${lessonId}&name=${encodeURIComponent(lesson?.name || '')}`);
    }
  };

  const handleExercise = (difficulty: Difficulty) => {
    if (lessonId) {
      navigate(`/practice-question/${lessonId}?difficulty=${difficulty}`);
    }
  };

  // Calculate overall progress percentage
  const calculateProgress = (): number => {
    if (!progress) return 0;
    let completed = 0;
    if (progress.easy_mastered) completed++;
    if (progress.medium_mastered) completed++;
    if (progress.hard_mastered) completed++;
    return Math.round((completed / 3) * 100);
  };

  const isDifficultyCompleted = (difficulty: Difficulty): boolean => {
    if (!progress) return false;
    switch (difficulty) {
      case 'easy': return progress.easy_mastered ?? false;
      case 'medium': return progress.medium_mastered ?? false;
      case 'hard': return progress.hard_mastered ?? false;
      default: return false;
    }
  };

  // All difficulties are accessible, but we show recommendations
  const getDifficultyRecommendation = (difficulty: Difficulty): 'recommended' | 'advanced' | 'completed' | 'normal' => {
    const easyDone = progress?.easy_mastered ?? false;
    const mediumDone = progress?.medium_mastered ?? false;
    const hardDone = progress?.hard_mastered ?? false;

    if (difficulty === 'easy') {
      if (easyDone) return 'completed';
      return 'recommended';
    }
    if (difficulty === 'medium') {
      if (mediumDone) return 'completed';
      if (!easyDone) return 'advanced';
      return 'recommended';
    }
    if (difficulty === 'hard') {
      if (hardDone) return 'completed';
      if (!easyDone || !mediumDone) return 'advanced';
      return 'recommended';
    }
    return 'normal';
  };

  const progressPercentage = calculateProgress();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    );
  }

  // Generate animation steps
  const animationSteps = generateLessonExplanation(lesson.name, lesson.theory_explanation);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">{topic?.name} • Lesson {lessonIndex + 1}/{totalLessons}</p>
              <h1 className="text-xl font-semibold">{lesson.name}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Learning Resources */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Learning Resources
            </h2>
            
            {/* Theory Button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={handleTheory}
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Theory</p>
                <p className="text-xs text-muted-foreground">Read the concepts</p>
              </div>
            </Button>

            {/* AI Explanation Button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => setShowAIExplanation(!showAIExplanation)}
            >
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">AI Explanation</p>
                <p className="text-xs text-muted-foreground">Watch animated lesson</p>
              </div>
            </Button>

            {/* Progress Bar */}
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lesson Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex gap-2 mt-3">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                      <div
                        key={diff}
                        className={`flex-1 text-center py-1 px-2 rounded text-xs font-medium ${
                          isDifficultyCompleted(diff)
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        {isDifficultyCompleted(diff) && (
                          <CheckCircle2 className="h-3 w-3 inline ml-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center/Right Column */}
          <div className="lg:col-span-2">
            {showAIExplanation ? (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  AI Animated Explanation
                </h2>
                <AnimatedMathVideo
                  title={lesson.name}
                  steps={animationSteps}
                  onComplete={() => console.log('Animation complete')}
                />
              </div>
            ) : (
              /* Exercise Difficulty Buttons */
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Practice Exercises
                </h2>
                
                <div className="grid gap-4">
                  {/* Easy */}
                  <DifficultyCard
                    difficulty="easy"
                    label="Easy"
                    description="Start with the basics"
                    recommendation={getDifficultyRecommendation('easy')}
                    isCompleted={isDifficultyCompleted('easy')}
                    onClick={() => handleExercise('easy')}
                  />

                  {/* Medium */}
                  <DifficultyCard
                    difficulty="medium"
                    label="Medium"
                    description="Challenge yourself"
                    recommendation={getDifficultyRecommendation('medium')}
                    isCompleted={isDifficultyCompleted('medium')}
                    onClick={() => handleExercise('medium')}
                  />

                  {/* Hard */}
                  <DifficultyCard
                    difficulty="hard"
                    label="Hard"
                    description="Master the topic"
                    recommendation={getDifficultyRecommendation('hard')}
                    isCompleted={isDifficultyCompleted('hard')}
                    onClick={() => handleExercise('hard')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DifficultyCardProps {
  difficulty: Difficulty;
  label: string;
  description: string;
  recommendation: 'recommended' | 'advanced' | 'completed' | 'normal';
  isCompleted: boolean;
  onClick: () => void;
}

function DifficultyCard({
  difficulty,
  label,
  description,
  recommendation,
  isCompleted,
  onClick,
}: DifficultyCardProps) {
  const colorMap = {
    easy: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    medium: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    hard: { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  };
  
  const colors = colorMap[difficulty];
  const isAdvanced = recommendation === 'advanced';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-6 rounded-xl border-2 transition-all hover:shadow-md",
        isCompleted
          ? `${colors.bg} ${colors.border}`
          : isAdvanced
            ? "bg-card border-amber-400/50"
            : "bg-card border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            colors.bg
          )}>
            {isCompleted ? (
              <CheckCircle2 className={`h-6 w-6 ${colors.text}`} />
            ) : (
              <span className={`text-xl font-bold ${colors.text}`}>
                {label.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{label}</h3>
              {isAdvanced && (
                <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  Advanced
                </span>
              )}
              {recommendation === 'recommended' && !isCompleted && (
                <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isAdvanced ? 'Complete easier levels first for best results' : description}
            </p>
          </div>
        </div>
        {isCompleted && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
            Completed
          </span>
        )}
      </div>
    </button>
  );
}
