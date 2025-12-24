import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTutor } from '@/contexts/TutorContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TopicGrid from '@/components/TopicGrid';
import { TutorAvatar } from '@/components/tutor/TutorAvatar';
import TutorChat from '@/components/TutorChat';
import { Sparkles, Star, Flame, Target, TrendingUp, AlertTriangle, ArrowRight, Play, MessageCircle, Pentagon, Lightbulb, BookOpen, Mic, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
interface Topic {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  order_index: number;
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
  topic_name?: string;
}
interface DiagnosticStatus {
  topic_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
}
export default function Dashboard() {
  const {
    user,
    signOut,
    loading: authLoading
  } = useAuth();
  const {
    preferences: tutorPrefs,
    isLoading: tutorLoading
  } = useTutor();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [subtopicProgress, setSubtopicProgress] = useState<SubtopicProgress[]>([]);
  const [diagnosticStatuses, setDiagnosticStatuses] = useState<DiagnosticStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorChat, setShowTutorChat] = useState(false);
  const [tutorMood, setTutorMood] = useState<'idle' | 'happy' | 'encouraging'>('happy');
  const [aiInsights, setAiInsights] = useState<{
    greeting?: string;
    mainFocus?: string;
    insights?: Array<{
      type: string;
      text: string;
    }>;
    motivationalNote?: string;
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
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

  // Fetch AI insights when data is loaded
  useEffect(() => {
    if (!isLoading && profile && topics.length > 0) {
      const weakSubs = subtopicProgress.filter(sp => sp.mastery_percentage < 60 && sp.mastery_percentage > 0).sort((a, b) => a.mastery_percentage - b.mastery_percentage).slice(0, 3);
      fetchAiInsights(profile, topics, progress, weakSubs);
    }
  }, [isLoading, profile, topics, progress, subtopicProgress, tutorPrefs.tutorName, tutorPrefs.personality]);
  const checkComprehensiveDiagnostic = async () => {
    try {
      const {
        data: profileData
      } = await supabase.from('profiles').select('comprehensive_diagnostic_completed').eq('id', user!.id).single();
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
      const {
        data: topicsData
      } = await supabase.from('topics').select('*').order('order_index');
      setTopics(topicsData || []);
      const {
        data: subtopicsData
      } = await supabase.from('subtopics').select('id, name, topic_id');
      const subtopicMap = new Map((subtopicsData || []).map(s => [s.id, {
        name: s.name,
        topic_id: s.topic_id
      }]));
      const topicMap = new Map((topicsData || []).map(t => [t.id, t.name]));
      const {
        data: profileData
      } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
      setProfile(profileData);
      const {
        data: progressData
      } = await supabase.from('user_topic_progress').select('*').eq('user_id', user!.id);
      setProgress(progressData || []);
      const {
        data: subtopicProgressData
      } = await supabase.from('user_subtopic_progress').select('*').eq('user_id', user!.id);
      const enrichedSubtopicProgress = (subtopicProgressData || []).map(sp => {
        const subtopicInfo = subtopicMap.get(sp.subtopic_id);
        return {
          subtopic_id: sp.subtopic_id,
          subtopic_name: subtopicInfo?.name || 'Unknown',
          mastery_percentage: sp.mastery_percentage,
          topic_name: subtopicInfo?.topic_id ? topicMap.get(subtopicInfo.topic_id) : undefined
        };
      });
      setSubtopicProgress(enrichedSubtopicProgress);
      const {
        data: diagnosticData
      } = await supabase.from('diagnostic_tests').select('topic_id, status').eq('user_id', user!.id);
      setDiagnosticStatuses((diagnosticData || []) as DiagnosticStatus[]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load your data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch AI-generated insights
  const fetchAiInsights = async (profileData: Profile | null, topicsData: Topic[], progressData: TopicProgress[], weakSubtopicsData: SubtopicProgress[]) => {
    if (!profileData) return;
    setInsightsLoading(true);
    try {
      const topicProgressForAI = progressData.map(p => {
        const topic = topicsData.find(t => t.id === p.topic_id);
        return {
          name: topic?.name || 'Unknown',
          mastery: p.mastery_percentage
        };
      });
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-daily-insights', {
        body: {
          studentName: profileData.display_name || 'Student',
          tutorName: tutorPrefs.tutorName,
          tutorPersonality: tutorPrefs.personality,
          currentStreak: profileData.current_streak || 0,
          totalXp: profileData.total_xp || 0,
          topicProgress: topicProgressForAI,
          weakSubtopics: weakSubtopicsData.slice(0, 3)
        }
      });
      if (error) {
        console.error('Error fetching AI insights:', error);
        return;
      }
      if (data && !data.fallback) {
        setAiInsights(data);
        setTutorMood('happy');
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };
  const getTopicProgress = (topicId: string) => {
    const topicProgress = progress.find(p => p.topic_id === topicId);
    return {
      masteryPercentage: topicProgress?.mastery_percentage || 0,
      exercisesCompleted: topicProgress?.exercises_completed || 0
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

  // Find best topic (highest mastery)
  const bestTopic = progress.length > 0 ? progress.reduce((best, current) => current.mastery_percentage > best.mastery_percentage ? current : best) : null;
  const bestTopicName = bestTopic ? topics.find(t => t.id === bestTopic.topic_id)?.name : null;

  // Find weakest subtopics for "Needs Attention"
  const weakSubtopics = subtopicProgress.filter(sp => sp.mastery_percentage < 60 && sp.mastery_percentage > 0).sort((a, b) => a.mastery_percentage - b.mastery_percentage).slice(0, 2);

  // Get current topic (first incomplete or in-progress)
  const currentTopic = topics.find(t => {
    const diagnostic = diagnosticStatuses.find(d => d.topic_id === t.id);
    const prog = getTopicProgress(t.id);
    return !diagnostic || diagnostic.status !== 'completed' || prog.masteryPercentage < 80;
  });
  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        </div>
      </div>;
  }
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Student';
  const tutorName = tutorPrefs.tutorName;

  // XP chart data (mock for visual)
  const xpBars = [40, 60, 50, 75, 55, 90, 100];

  // Generate personalized greeting based on time of day and progress
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Generate personalized recommendation
  const getPersonalizedRecommendation = () => {
    if (weakSubtopics.length > 0) {
      return {
        type: 'weakness',
        message: `I noticed you're still working on ${weakSubtopics[0].subtopic_name}. Let's tackle that together today!`,
        action: 'Practice Now',
        topic: weakSubtopics[0]
      };
    }
    if (currentTopic) {
      const prog = getTopicProgress(currentTopic.id);
      if (prog.masteryPercentage > 0 && prog.masteryPercentage < 80) {
        return {
          type: 'continue',
          message: `You're ${prog.masteryPercentage}% through ${currentTopic.name}. Let's keep that momentum going!`,
          action: 'Continue Learning',
          topic: currentTopic
        };
      }
    }
    return {
      type: 'new',
      message: `Ready to explore something new? I've got some great topics lined up for you!`,
      action: 'Start Learning',
      topic: topics[0]
    };
  };
  const recommendation = getPersonalizedRecommendation();
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none" style={{
      background: 'radial-gradient(circle at 15% 50%, hsla(239, 84%, 67%, 0.08) 0%, transparent 25%), radial-gradient(circle at 85% 30%, hsla(160, 84%, 39%, 0.05) 0%, transparent 25%)'
    }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary ring-1 ring-white/5">
              <Pentagon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-serif font-medium tracking-tight text-foreground">MathMastery</h2>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-surface-highlight/50 p-1 rounded-full border border-white/5">
            <Link to="/dashboard" className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary ring-1 ring-primary/20">
              Learning
            </span>
            <Link to="/practice" className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Practice
            </Link>
            <Link to="/session-history" className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              History
            </Link>
            <Link to="/notebook" className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Notebook
            </Link>
          </nav>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <Link to="/profile" className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{displayName}</p>
                <p className="text-xs text-muted-foreground">Student</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 ring-2 ring-surface-highlight group-hover:ring-primary/50 transition-all flex items-center justify-center text-foreground font-medium">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-10">
        {/* Tutor Greeting Section */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6
      }} className="glass rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 relative z-10">
            {/* Tutor Avatar */}
            <div className="flex-shrink-0">
              <TutorAvatar style={tutorPrefs.avatarStyle} mood={tutorMood} size="lg" />
            </div>
            
            {/* Greeting Content */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium uppercase tracking-wider">{tutorName} says</span>
                {insightsLoading && <span className="text-xs text-muted-foreground animate-pulse ml-2">analyzing your progress...</span>}
              </div>
              <h1 className="text-3xl md:text-4xl font-serif text-foreground leading-tight">
                {aiInsights?.greeting || `${getTimeGreeting()}, ${displayName}!`} 👋
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {aiInsights?.mainFocus || recommendation.message}
              </p>
              
              {/* AI Insights Pills */}
              {aiInsights?.insights && aiInsights.insights.length > 0 && <div className="flex flex-wrap gap-2 pt-1">
                  {aiInsights.insights.map((insight, idx) => <motion.div key={idx} initial={{
                opacity: 0,
                scale: 0.9
              }} animate={{
                opacity: 1,
                scale: 1
              }} transition={{
                delay: idx * 0.1
              }} className={`px-3 py-1.5 rounded-full text-xs font-medium ${insight.type === 'strength' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : insight.type === 'improvement' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {insight.type === 'strength' && '✓ '}
                      {insight.type === 'improvement' && '↑ '}
                      {insight.type === 'tip' && '💡 '}
                      {insight.text}
                    </motion.div>)}
                </div>}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={() => {
                if (recommendation.type === 'weakness') {
                  navigate('/practice');
                } else if (recommendation.topic && 'id' in recommendation.topic) {
                  handleTopicClick(recommendation.topic.id);
                }
              }} className="px-6 py-3 h-auto rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
                  <Play className="w-4 h-4 mr-2" />
                  {recommendation.action}
                </Button>
                <Button variant="outline" onClick={() => setShowTutorChat(true)} className="px-6 py-3 h-auto rounded-xl bg-card border-border text-muted-foreground hover:bg-surface-highlight hover:text-foreground">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ask {tutorName}
                </Button>
                <Button variant="outline" onClick={() => navigate('/voice-tutor')} className="px-6 py-3 h-auto rounded-xl bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20">
                  <Mic className="w-4 h-4 mr-2" />
                  Voice Mode
                </Button>
                <Button variant="outline" onClick={() => navigate('/bookmarks')} className="px-6 py-3 h-auto rounded-xl bg-card border-border text-muted-foreground hover:bg-surface-highlight hover:text-foreground">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Bookmarks
                </Button>
              </div>
            </div>

            {/* Daily Tips Card with AI Motivational Note */}
            <div className="lg:w-72 w-full glass rounded-2xl p-5 border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">{tutorName}'s Tip</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiInsights?.motivationalNote || (profile?.current_streak && profile.current_streak > 0 ? `Amazing ${profile.current_streak}-day streak! Consistency is key to mastering math. Keep it up!` : `Start your streak today! Even 10 minutes of practice makes a big difference.`)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1,
        duration: 0.6
      }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total XP Card */}
          <div className="glass rounded-2xl p-6 relative overflow-hidden group hover:bg-surface-highlight/40 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all" />
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total XP</span>
                <span className="text-3xl font-serif text-foreground mt-1">{(profile?.total_xp || 0).toLocaleString()}</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                <Star className="w-5 h-5" />
              </div>
            </div>
            <div className="h-10 flex items-end gap-1 mt-2 opacity-60">
              {xpBars.map((height, i) => <div key={i} className={`w-full rounded-t-sm transition-all ${i === xpBars.length - 1 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-yellow-500/20'}`} style={{
              height: `${height}%`
            }} />)}
            </div>
          </div>

          {/* Daily Streak Card */}
          <div className="glass rounded-2xl p-6 relative overflow-hidden group hover:bg-surface-highlight/40 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all" />
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Daily Streak</span>
                <span className="text-3xl font-serif text-foreground mt-1">
                  {profile?.current_streak || 0} <span className="text-sm font-sans text-muted-foreground">days</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-1.5 bg-card rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full relative" style={{
                width: `${Math.min((profile?.current_streak || 0) / 14 * 100, 100)}%`
              }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <span className="text-xs text-orange-400 font-medium">Keep it up!</span>
            </div>
          </div>

          {/* Best Topic Card */}
          <div className="glass rounded-2xl p-6 relative overflow-hidden group hover:bg-surface-highlight/40 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Topic</span>
                <span className="text-xl font-medium text-foreground mt-1 truncate max-w-[140px]">
                  {bestTopicName || 'Start Learning'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <Target className="w-5 h-5" />
              </div>
            </div>
            {bestTopic && <div className="flex items-center gap-3 mt-3">
                <div className="relative w-10 h-10">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-card" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-emerald-500 drop-shadow-[0_0_2px_rgba(16,185,129,0.8)]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${bestTopic.mastery_percentage}, 100`} strokeWidth="3" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                    {bestTopic.mastery_percentage}%
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-tight">You're in the top 5% of learners in this topic.</p>
              </div>}
          </div>
        </motion.div>

        {/* Performance Trend & Needs Attention */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2,
        duration: 0.6
      }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Trend */}
          <div className="lg:col-span-2 glass rounded-2xl p-8 border border-border flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-medium text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Performance Trend
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Your understanding over the last 30 days</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground">
                Advanced
              </span>
            </div>
            <div className="h-48 w-full relative flex items-end justify-between gap-2 px-2">
              {[30, 45, 35, 60, 55, 75, 85, 90].map((height, i) => <div key={i} className={`w-full rounded-t-sm transition-all duration-300 hover:opacity-80 ${i === 7 ? 'bg-surface-highlight border-t border-dashed border-muted-foreground/40 opacity-50' : i >= 5 ? 'bg-primary/40 hover:bg-primary/60' : i >= 3 ? 'bg-primary/20 hover:bg-primary/40' : 'bg-primary/10 hover:bg-primary/30'}`} style={{
              height: `${height}%`
            }} />)}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="glass rounded-2xl p-8 border border-amber-900/20 relative overflow-hidden">
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-600/5 rounded-full blur-3xl" />
            <h3 className="text-lg font-medium text-foreground mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Needs Attention
            </h3>
            <div className="flex flex-col gap-4 relative z-10">
              {weakSubtopics.length > 0 ? weakSubtopics.map((sp, i) => <div key={sp.subtopic_id} onClick={() => navigate(`/practice`)} className="p-4 rounded-xl bg-card/50 border border-amber-500/10 hover:border-amber-500/30 transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">{sp.topic_name || 'Math'}</span>
                    <ArrowRight className="w-4 h-4 text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <h4 className="text-muted-foreground font-medium text-sm">{sp.subtopic_name}</h4>
                  <div className="mt-3 h-1 w-full bg-card rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600/80 rounded-full" style={{
                  width: `${sp.mastery_percentage}%`
                }} />
                  </div>
                </div>) : <>
                  <div className="p-4 rounded-xl bg-card/50 border border-amber-500/10 hover:border-amber-500/30 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">Algebra</span>
                      <ArrowRight className="w-4 h-4 text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <h4 className="text-muted-foreground font-medium text-sm">Exponential Properties</h4>
                    <div className="mt-3 h-1 w-full bg-card rounded-full overflow-hidden">
                      <div className="h-full w-[45%] bg-amber-600/80 rounded-full" />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-card/50 border border-amber-500/10 hover:border-amber-500/30 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">Calculus</span>
                      <ArrowRight className="w-4 h-4 text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <h4 className="text-muted-foreground font-medium text-sm">Limits & Continuity</h4>
                    <div className="mt-3 h-1 w-full bg-card rounded-full overflow-hidden">
                      <div className="h-full w-[60%] bg-amber-600/80 rounded-full" />
                    </div>
                  </div>
                </>}
            </div>
          </div>
        </motion.div>

        {/* Your Learning Path - Full Grid View */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3,
        duration: 0.6
      }}>
          <TopicGrid topics={topics} getTopicProgress={getTopicProgress} diagnosticStatuses={diagnosticStatuses} onTopicClick={handleTopicClick} />
        </motion.div>
      </main>

      {/* Floating Ask Tutor Button */}
      

      {/* Tutor Chat Panel */}
      {showTutorChat && <TutorChat subtopicName="General Help" onClose={() => setShowTutorChat(false)} />}
    </div>;
}