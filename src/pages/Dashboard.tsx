import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TopicCard } from '@/components/TopicCard';
import { StatsBar } from '@/components/StatsBar';
import PerformanceCard from '@/components/PerformanceCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, LogOut, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Topic {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  order_index: number;
}

interface Subtopic {
  id: string;
  name: string;
  topic_id: string;
}

interface Profile {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  display_name: string | null;
}

interface TopicProgress {
  topic_id: string;
  mastery_percentage: number;
  exercises_completed: number;
}

interface SubtopicProgress {
  subtopic_id: string;
  subtopic_name: string;
  mastery_percentage: number;
  exercises_completed: number;
  exercises_correct: number;
  hints_used: number;
}

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [subtopicProgress, setSubtopicProgress] = useState<SubtopicProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('order_index');
      
      if (topicsError) throw topicsError;
      setTopics(topicsData || []);

      // Load subtopics for name mapping
      const { data: subtopicsData, error: subtopicsError } = await supabase
        .from('subtopics')
        .select('id, name, topic_id');
      
      if (subtopicsError) throw subtopicsError;
      const subtopicMap = new Map((subtopicsData || []).map(s => [s.id, s.name]));

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      setProfile(profileData);

      // Load topic progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', user!.id);
      
      if (progressError) throw progressError;
      setProgress(progressData || []);

      // Load subtopic progress
      const { data: subtopicProgressData, error: subtopicProgressError } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', user!.id);
      
      if (subtopicProgressError) throw subtopicProgressError;
      
      // Enrich with subtopic names
      const enrichedSubtopicProgress = (subtopicProgressData || []).map(sp => ({
        subtopic_id: sp.subtopic_id,
        subtopic_name: subtopicMap.get(sp.subtopic_id) || 'Unknown',
        mastery_percentage: sp.mastery_percentage,
        exercises_completed: sp.exercises_completed,
        exercises_correct: sp.exercises_correct,
        hints_used: sp.hints_used,
      }));
      
      setSubtopicProgress(enrichedSubtopicProgress);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load your data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getTopicProgress = (topicId: string) => {
    const topicProgress = progress.find(p => p.topic_id === topicId);
    return {
      masteryPercentage: topicProgress?.mastery_percentage || 0,
      exercisesCompleted: topicProgress?.exercises_completed || 0,
    };
  };

  const handleTopicClick = (topicId: string) => {
    navigate(`/practice/${topicId}`);
  };

  // Calculate overall mastery
  const overallMastery = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.mastery_percentage, 0) / progress.length)
    : 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">MathPath</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{displayName}</span>
          </h1>
          <p className="text-muted-foreground">
            Continue your math journey. Pick a topic to practice.
          </p>
        </div>

        {/* Stats */}
        <StatsBar 
          totalXp={profile?.total_xp || 0}
          currentStreak={profile?.current_streak || 0}
          longestStreak={profile?.longest_streak || 0}
        />

        {/* Performance Insights */}
        <PerformanceCard 
          subtopicProgress={subtopicProgress}
          overallMastery={overallMastery}
        />

        {/* Topics grid */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Topics</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map((topic, index) => {
              const { masteryPercentage, exercisesCompleted } = getTopicProgress(topic.id);
              return (
                <div 
                  key={topic.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TopicCard
                    name={topic.name}
                    description={topic.description}
                    icon={topic.icon}
                    masteryPercentage={masteryPercentage}
                    exercisesCompleted={exercisesCompleted}
                    onClick={() => handleTopicClick(topic.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
