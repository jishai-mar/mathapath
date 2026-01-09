import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, MessageCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { NodeTutorChat } from '@/components/lesson';
import { cn } from '@/lib/utils';
import { getTopicSlugFromDatabaseId } from '@/data/topicDatabaseMapping';

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

export default function LessonScreen() {
  const { topicId, lessonId } = useParams<{ topicId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [lesson, setLesson] = useState<SubtopicData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorChat, setShowTutorChat] = useState(false);
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
      const { data: topicData } = await supabase
        .from('topics')
        .select('id, name')
        .eq('id', topicId)
        .single();
      
      if (topicData) setTopic(topicData);

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

  const handleExercise = (difficulty: Difficulty) => {
    if (lessonId) {
      navigate(`/practice-question/${lessonId}?difficulty=${difficulty}`);
    }
  };

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

  // Get the theory slug for this topic
  const theorySlug = topicId ? getTopicSlugFromDatabaseId(topicId) : null;

  const handleOpenTheory = () => {
    if (theorySlug && lessonId) {
      navigate(`/theory/${theorySlug}/${lessonId}`);
    } else if (theorySlug) {
      navigate(`/theory/${theorySlug}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NodeTutorChat
        isOpen={showTutorChat}
        onClose={() => setShowTutorChat(false)}
        lessonId={lessonId || ''}
        lessonName={lesson.name}
        lessonIndex={lessonIndex}
        topicName={topic?.name}
        theoryContent={lesson.theory_explanation}
      />

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

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Learning Resources
            </h2>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={handleOpenTheory}
              disabled={!theorySlug}
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Theory</p>
                <p className="text-xs text-muted-foreground">Learn the concepts for this topic</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => setShowTutorChat(true)}
            >
              <MessageCircle className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Ask Questions</p>
                <p className="text-xs text-muted-foreground">Get help with this step</p>
              </div>
            </Button>

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

          <div className="lg:col-span-2">
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Practice Exercises
              </h2>
              
              <div className="grid gap-4">
                <DifficultyCard
                  difficulty="easy"
                  label="Easy"
                  description="Start with the basics"
                  recommendation={getDifficultyRecommendation('easy')}
                  isCompleted={isDifficultyCompleted('easy')}
                  onClick={() => handleExercise('easy')}
                />
                <DifficultyCard
                  difficulty="medium"
                  label="Medium"
                  description="Challenge yourself"
                  recommendation={getDifficultyRecommendation('medium')}
                  isCompleted={isDifficultyCompleted('medium')}
                  onClick={() => handleExercise('medium')}
                />
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

function DifficultyCard({ difficulty, label, description, recommendation, isCompleted, onClick }: DifficultyCardProps) {
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
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", colors.bg)}>
            {isCompleted ? (
              <CheckCircle2 className={`h-6 w-6 ${colors.text}`} />
            ) : (
              <span className={`text-xl font-bold ${colors.text}`}>{label.charAt(0)}</span>
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
