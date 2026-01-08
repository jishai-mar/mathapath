import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import AnimatedMathVideo, { generateAnimationSteps } from '@/components/AnimatedMathVideo';

interface SubtopicData {
  id: string;
  name: string;
  theory_explanation: string | null;
  worked_examples: any[];
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
  const [showAIExplanation, setShowAIExplanation] = useState(false);

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
        .select('id, name, theory_explanation, worked_examples')
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

      // Fetch user progress if logged in
      if (user && lessonId) {
        const { data: progressData } = await supabase
          .from('user_subtopic_progress')
          .select('easy_mastered, medium_mastered, hard_mastered, mastery_percentage')
          .eq('user_id', user.id)
          .eq('subtopic_id', lessonId)
          .single();
        
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
      navigate(`/theory/${topicId}/${lessonId}`);
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

  const isDifficultyUnlocked = (difficulty: Difficulty): boolean => {
    if (difficulty === 'easy') return true;
    if (!progress) return false;
    
    switch (difficulty) {
      case 'medium': return progress.easy_mastered ?? false;
      case 'hard': return progress.medium_mastered ?? false;
      default: return false;
    }
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

  // Generate animation steps for AI explanation
  const animationSteps = lesson ? generateAnimationSteps(
    lesson.name,
    lesson.theory_explanation || '',
    lesson.worked_examples?.[0]
  ) : [];

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
              <p className="text-sm text-muted-foreground">{topic?.name}</p>
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

          {/* Center Column - AI Explanation (when shown) */}
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
              /* Right Side - Exercise Difficulty Buttons */
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
                    color="text-green-500"
                    bgColor="bg-green-500/10"
                    borderColor="border-green-500/30"
                    isCompleted={isDifficultyCompleted('easy')}
                    isUnlocked={isDifficultyUnlocked('easy')}
                    onClick={() => handleExercise('easy')}
                  />

                  {/* Medium */}
                  <DifficultyCard
                    difficulty="medium"
                    label="Medium"
                    description="Challenge yourself"
                    color="text-yellow-500"
                    bgColor="bg-yellow-500/10"
                    borderColor="border-yellow-500/30"
                    isCompleted={isDifficultyCompleted('medium')}
                    isUnlocked={isDifficultyUnlocked('medium')}
                    onClick={() => handleExercise('medium')}
                  />

                  {/* Hard */}
                  <DifficultyCard
                    difficulty="hard"
                    label="Hard"
                    description="Master the topic"
                    color="text-red-500"
                    bgColor="bg-red-500/10"
                    borderColor="border-red-500/30"
                    isCompleted={isDifficultyCompleted('hard')}
                    isUnlocked={isDifficultyUnlocked('hard')}
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
  color: string;
  bgColor: string;
  borderColor: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  onClick: () => void;
}

function DifficultyCard({
  label,
  description,
  color,
  bgColor,
  borderColor,
  isCompleted,
  isUnlocked,
  onClick,
}: DifficultyCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isUnlocked}
      className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
        !isUnlocked
          ? 'bg-muted/50 border-border cursor-not-allowed opacity-60'
          : isCompleted
          ? `${bgColor} ${borderColor} hover:shadow-md`
          : `bg-card border-border hover:${borderColor} hover:shadow-md`
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            !isUnlocked ? 'bg-muted' : bgColor
          }`}>
            {!isUnlocked ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : isCompleted ? (
              <CheckCircle2 className={`h-6 w-6 ${color}`} />
            ) : (
              <span className={`text-xl font-bold ${color}`}>
                {label.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${!isUnlocked ? 'text-muted-foreground' : ''}`}>
              {label}
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {isCompleted && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${bgColor} ${color}`}>
            Completed
          </span>
        )}
      </div>
    </button>
  );
}
