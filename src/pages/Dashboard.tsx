import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TopicCard } from '@/components/TopicCard';
import { StatsBar } from '@/components/StatsBar';
import PerformanceCard from '@/components/PerformanceCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sigma, LogOut, BookOpen, User, Sparkles } from 'lucide-react';
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

interface DiagnosticStatus {
  topic_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [subtopicProgress, setSubtopicProgress] = useState<SubtopicProgress[]>([]);
  const [diagnosticStatuses, setDiagnosticStatuses] = useState<DiagnosticStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkComprehensiveDiagnostic();
    }
  }, [user]);

  const checkComprehensiveDiagnostic = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('comprehensive_diagnostic_completed')
        .eq('id', user!.id)
        .single();

      if (!profileData?.comprehensive_diagnostic_completed) {
        navigate('/diagnostic');
        return;
      }

      loadData();
    } catch (error) {
      navigate('/diagnostic');
    }
  };

  const loadData = async () => {
    try {
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('order_index');
      
      if (topicsError) throw topicsError;
      setTopics(topicsData || []);

      const { data: subtopicsData, error: subtopicsError } = await supabase
        .from('subtopics')
        .select('id, name, topic_id');
      
      if (subtopicsError) throw subtopicsError;
      const subtopicMap = new Map((subtopicsData || []).map(s => [s.id, s.name]));

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      setProfile(profileData);

      const { data: progressData, error: progressError } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', user!.id);
      
      if (progressError) throw progressError;
      setProgress(progressData || []);

      const { data: subtopicProgressData, error: subtopicProgressError } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', user!.id);
      
      if (subtopicProgressError) throw subtopicProgressError;
      
      const enrichedSubtopicProgress = (subtopicProgressData || []).map(sp => ({
        subtopic_id: sp.subtopic_id,
        subtopic_name: subtopicMap.get(sp.subtopic_id) || 'Unknown',
        mastery_percentage: sp.mastery_percentage,
        exercises_completed: sp.exercises_completed,
        exercises_correct: sp.exercises_correct,
        hints_used: sp.hints_used,
      }));
      
      setSubtopicProgress(enrichedSubtopicProgress);

      const { data: diagnosticData } = await supabase
        .from('diagnostic_tests')
        .select('topic_id, status')
        .eq('user_id', user!.id);
      
      setDiagnosticStatuses((diagnosticData || []) as DiagnosticStatus[]);
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
    const diagnosticStatus = diagnosticStatuses.find(d => d.topic_id === topicId);
    
    if (!diagnosticStatus || diagnosticStatus.status !== 'completed') {
      navigate(`/diagnostic/${topicId}`);
    } else {
      navigate(`/practice/${topicId}`);
    }
  };

  const overallMastery = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.mastery_percentage, 0) / progress.length)
    : 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsla(145, 76%, 30%, 0.08) 0%, transparent 50%)',
        }}
      />
      <div className="fixed top-40 -left-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-40 -right-20 w-96 h-96 rounded-full bg-primary/3 blur-3xl animate-float-slow pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b border-border/30">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Sigma className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">MathPath</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/profile')}
                className="text-muted-foreground hover:text-foreground"
              >
                <User className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {/* Welcome section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm text-primary font-medium">Welcome back</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              {displayName}
            </h1>
            <p className="text-muted-foreground">
              Continue your math journey. Pick a topic to practice.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <StatsBar 
              totalXp={profile?.total_xp || 0}
              currentStreak={profile?.current_streak || 0}
              longestStreak={profile?.longest_streak || 0}
            />
          </motion.div>

          {/* Performance Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <PerformanceCard 
              subtopicProgress={subtopicProgress}
              overallMastery={overallMastery}
            />
          </motion.div>

          {/* Topics grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Topics</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((topic, index) => {
                const { masteryPercentage, exercisesCompleted } = getTopicProgress(topic.id);
                return (
                  <motion.div 
                    key={topic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.4 }}
                  >
                    <TopicCard
                      name={topic.name}
                      description={topic.description}
                      icon={topic.icon}
                      masteryPercentage={masteryPercentage}
                      exercisesCompleted={exercisesCompleted}
                      onClick={() => handleTopicClick(topic.id)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
