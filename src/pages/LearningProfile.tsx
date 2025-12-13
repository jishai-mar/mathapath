import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Brain, 
  Zap, 
  Award,
  BookOpen,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import LevelBadge, { getLevel } from '@/components/LevelBadge';

interface TopicProgress {
  topic_id: string;
  topic_name: string;
  mastery_percentage: number;
  exercises_completed: number;
  exercises_correct: number;
}

interface SubtopicProgress {
  subtopic_id: string;
  subtopic_name: string;
  topic_name: string;
  mastery_percentage: number;
  exercises_completed: number;
  exercises_correct: number;
  hints_used: number;
}

interface MisconceptionPattern {
  tag: string;
  count: number;
}

interface DifficultyStats {
  easy: { correct: number; total: number; rate: number };
  medium: { correct: number; total: number; rate: number };
  hard: { correct: number; total: number; rate: number };
}

interface ProfileData {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
}

export default function LearningProfile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [subtopicProgress, setSubtopicProgress] = useState<SubtopicProgress[]>([]);
  const [misconceptions, setMisconceptions] = useState<MisconceptionPattern[]>([]);
  const [difficultyStats, setDifficultyStats] = useState<DifficultyStats>({
    easy: { correct: 0, total: 0, rate: 0 },
    medium: { correct: 0, total: 0, rate: 0 },
    hard: { correct: 0, total: 0, rate: 0 },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_xp, current_streak, longest_streak')
        .eq('id', user!.id)
        .single();
      
      setProfile(profileData);

      // Load topics
      const { data: topics } = await supabase
        .from('topics')
        .select('id, name');
      
      const topicMap = new Map((topics || []).map(t => [t.id, t.name]));

      // Load subtopics
      const { data: subtopics } = await supabase
        .from('subtopics')
        .select('id, name, topic_id');
      
      const subtopicMap = new Map((subtopics || []).map(s => [s.id, { name: s.name, topic_id: s.topic_id }]));

      // Load topic progress
      const { data: topicProgressData } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', user!.id);

      const enrichedTopicProgress = (topicProgressData || []).map(tp => ({
        topic_id: tp.topic_id,
        topic_name: topicMap.get(tp.topic_id) || 'Unknown',
        mastery_percentage: tp.mastery_percentage,
        exercises_completed: tp.exercises_completed,
        exercises_correct: tp.exercises_correct,
      }));
      
      setTopicProgress(enrichedTopicProgress);

      // Load subtopic progress
      const { data: subtopicProgressData } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', user!.id);

      const enrichedSubtopicProgress = (subtopicProgressData || []).map(sp => {
        const subtopicInfo = subtopicMap.get(sp.subtopic_id);
        return {
          subtopic_id: sp.subtopic_id,
          subtopic_name: subtopicInfo?.name || 'Unknown',
          topic_name: topicMap.get(subtopicInfo?.topic_id || '') || 'Unknown',
          mastery_percentage: sp.mastery_percentage,
          exercises_completed: sp.exercises_completed,
          exercises_correct: sp.exercises_correct,
          hints_used: sp.hints_used,
        };
      });
      
      setSubtopicProgress(enrichedSubtopicProgress);

      // Load exercise attempts for difficulty stats and misconceptions
      const { data: attempts } = await supabase
        .from('exercise_attempts')
        .select('is_correct, misconception_tag, exercises!inner(difficulty)')
        .eq('user_id', user!.id);

      // Calculate difficulty stats
      const stats: DifficultyStats = {
        easy: { correct: 0, total: 0, rate: 0 },
        medium: { correct: 0, total: 0, rate: 0 },
        hard: { correct: 0, total: 0, rate: 0 },
      };

      const misconceptionCounts: Record<string, number> = {};

      (attempts || []).forEach((attempt: any) => {
        const diff = attempt.exercises?.difficulty as 'easy' | 'medium' | 'hard';
        if (diff && stats[diff]) {
          stats[diff].total++;
          if (attempt.is_correct) stats[diff].correct++;
        }
        if (attempt.misconception_tag) {
          misconceptionCounts[attempt.misconception_tag] = (misconceptionCounts[attempt.misconception_tag] || 0) + 1;
        }
      });

      // Calculate rates
      Object.keys(stats).forEach(key => {
        const k = key as keyof DifficultyStats;
        stats[k].rate = stats[k].total > 0 ? Math.round((stats[k].correct / stats[k].total) * 100) : 0;
      });

      setDifficultyStats(stats);

      // Convert misconceptions to sorted array
      const misconceptionArray = Object.entries(misconceptionCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setMisconceptions(misconceptionArray);

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load your learning profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate insights
  const strengths = subtopicProgress.filter(s => 
    s.mastery_percentage >= 70 && s.exercises_completed >= 3
  ).sort((a, b) => b.mastery_percentage - a.mastery_percentage);

  const weaknesses = subtopicProgress.filter(s => {
    if (s.exercises_completed < 2) return false;
    const hintRatio = s.exercises_completed > 0 ? s.hints_used / s.exercises_completed : 0;
    return s.mastery_percentage < 50 || hintRatio > 0.5;
  }).sort((a, b) => a.mastery_percentage - b.mastery_percentage);

  const totalExercises = topicProgress.reduce((sum, t) => sum + t.exercises_completed, 0);
  const totalCorrect = topicProgress.reduce((sum, t) => sum + t.exercises_correct, 0);
  const overallAccuracy = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;
  const overallMastery = topicProgress.length > 0 
    ? Math.round(topicProgress.reduce((sum, t) => sum + t.mastery_percentage, 0) / topicProgress.length)
    : 0;

  // Determine recommended focus
  const recommendedFocus = weaknesses.slice(0, 3);
  const optimalDifficulty = difficultyStats.medium.rate >= 60 
    ? (difficultyStats.hard.rate >= 50 ? 'hard' : 'medium')
    : (difficultyStats.easy.rate >= 70 ? 'medium' : 'easy');

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Learning Profile</h1>
            <p className="text-sm text-muted-foreground">Your personalized learning insights</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{profile?.total_xp || 0}</div>
              <div className="text-xs text-muted-foreground">Total XP</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-[hsl(var(--xp-gold))]/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-[hsl(var(--xp-gold))]" />
              </div>
              <div className="text-2xl font-bold">{overallMastery}%</div>
              <div className="text-xs text-muted-foreground">Mastery</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{overallAccuracy}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{totalExercises}</div>
              <div className="text-xs text-muted-foreground">Exercises</div>
            </CardContent>
          </Card>
        </div>

        {/* Current Level */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Current Level</h3>
                <p className="text-sm text-muted-foreground">
                  {overallMastery < 25 && "You're just getting started. Keep practicing!"}
                  {overallMastery >= 25 && overallMastery < 50 && "You're making good progress. Keep it up!"}
                  {overallMastery >= 50 && overallMastery < 80 && "You're doing great! Almost there!"}
                  {overallMastery >= 80 && "Excellent work! You've mastered most topics!"}
                </p>
              </div>
              <LevelBadge level={getLevel(overallMastery)} showGlow className="text-sm px-3 py-1" />
            </div>
            <Progress value={overallMastery} className="mt-4 h-2" />
          </CardContent>
        </Card>

        {/* Performance by Difficulty */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              Performance by Difficulty
            </CardTitle>
            <CardDescription>
              Your success rate at each difficulty level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(['easy', 'medium', 'hard'] as const).map((diff) => {
                const stat = difficultyStats[diff];
                const color = diff === 'easy' ? 'bg-green-500' : diff === 'medium' ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div key={diff} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{diff}</span>
                      <span className="text-muted-foreground">
                        {stat.correct}/{stat.total} correct ({stat.rate}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${color} transition-all duration-500`}
                        style={{ width: `${stat.rate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <Lightbulb className="w-4 h-4 inline mr-1 text-primary" />
                <strong>Recommended:</strong> Focus on <span className="text-primary capitalize">{optimalDifficulty}</span> exercises for optimal learning.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-primary" />
                Your Strengths
              </CardTitle>
              <CardDescription>
                Topics you've mastered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strengths.length > 0 ? (
                <div className="space-y-3">
                  {strengths.slice(0, 5).map((s) => (
                    <div key={s.subtopic_id} className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <div>
                        <div className="font-medium text-sm">{s.subtopic_name}</div>
                        <div className="text-xs text-muted-foreground">{s.topic_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">{s.mastery_percentage}%</div>
                        <div className="text-xs text-muted-foreground">{s.exercises_completed} exercises</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete more exercises to identify your strengths.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="w-5 h-5 text-[hsl(var(--warning))]" />
                Areas for Improvement
              </CardTitle>
              <CardDescription>
                Topics that need more practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weaknesses.length > 0 ? (
                <div className="space-y-3">
                  {weaknesses.slice(0, 5).map((s) => (
                    <div key={s.subtopic_id} className="flex items-center justify-between p-2 rounded-lg bg-warning/5 border border-warning/10">
                      <div>
                        <div className="font-medium text-sm">{s.subtopic_name}</div>
                        <div className="text-xs text-muted-foreground">{s.topic_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[hsl(var(--warning))]">{s.mastery_percentage}%</div>
                        <div className="text-xs text-muted-foreground">{s.hints_used} hints used</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Great job! No major weaknesses identified yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommended Focus */}
        {recommendedFocus.length > 0 && (
          <Card className="bg-gradient-to-br from-[hsl(var(--warning))]/10 to-transparent border-[hsl(var(--warning))]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="w-5 h-5 text-[hsl(var(--warning))]" />
                Recommended Focus Areas
              </CardTitle>
              <CardDescription>
                Practice these topics to improve your overall mastery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {recommendedFocus.map((item, index) => (
                  <div 
                    key={item.subtopic_id}
                    className="flex items-center gap-4 p-3 bg-background/50 rounded-lg border border-border/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--warning))]/20 flex items-center justify-center text-sm font-bold text-[hsl(var(--warning))]">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.subtopic_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.topic_name} · {item.mastery_percentage}% mastery
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // Find topic ID for this subtopic
                        const topic = topicProgress.find(t => t.topic_name === item.topic_name);
                        if (topic) {
                          navigate(`/practice/${topic.topic_id}`);
                        }
                      }}
                    >
                      Practice
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Common Misconceptions */}
        {misconceptions.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="w-5 h-5 text-muted-foreground" />
                Common Misconceptions
              </CardTitle>
              <CardDescription>
                Patterns in your mistakes to watch out for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {misconceptions.map((m) => (
                  <span
                    key={m.tag}
                    className="px-3 py-1.5 rounded-full text-sm bg-destructive/10 text-destructive border border-destructive/20"
                  >
                    {m.tag} ({m.count}×)
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Topic Progress */}
        {topicProgress.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                Progress by Topic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topicProgress.map((topic) => (
                  <div key={topic.topic_id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{topic.topic_name}</span>
                      <span className="text-muted-foreground">{topic.mastery_percentage}%</span>
                    </div>
                    <Progress value={topic.mastery_percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {topic.exercises_correct}/{topic.exercises_completed} correct
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
