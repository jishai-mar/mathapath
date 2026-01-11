import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHistoryStats } from '@/hooks/useHistoryStats';
import { useWeeklyProgress } from '@/hooks/useWeeklyProgress';
import { SummaryStats } from '@/components/history/SummaryStats';
import { StreakSection } from '@/components/history/StreakSection';
import { FriendsLeaderboard } from '@/components/history/FriendsLeaderboard';
import { PracticeHistoryList } from '@/components/history/PracticeHistoryList';
import { AchievementsSection } from '@/components/history/AchievementsSection';
import { SessionHistorySection } from '@/components/history/SessionHistorySection';
import { WelcomeBanner } from '@/components/history/WelcomeBanner';
import { WeeklyProgressCard } from '@/components/history/WeeklyProgressCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

export default function History() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useHistoryStats();
  const { weeklyStats, loading: weeklyLoading } = useWeeklyProgress();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('first_name, display_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setUserName(data?.first_name || data?.display_name || null);
        });
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-semibold mb-4">Please log in to view your history</h2>
        <Button onClick={() => navigate('/auth')}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Your History</h1>
            <p className="text-muted-foreground">Track your learning journey</p>
          </div>
        </div>

        {/* Welcome Banner */}
        {statsLoading ? (
          <Skeleton className="h-32" />
        ) : (
          <WelcomeBanner
            userName={userName}
            currentStreak={stats.currentStreak}
            totalQuestions={stats.totalQuestions}
            averageAccuracy={stats.averageAccuracy}
            bestTopic={stats.bestTopic}
          />
        )}

        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <SummaryStats
            totalQuestions={stats.totalQuestions}
            averageAccuracy={stats.averageAccuracy}
            totalSessions={stats.totalSessions}
            lastPracticedDate={stats.lastPracticedDate}
            bestTopic={stats.bestTopic}
          />
        )}

        {/* Weekly Progress Card */}
        {weeklyLoading ? (
          <Skeleton className="h-48" />
        ) : weeklyStats ? (
          <WeeklyProgressCard weeklyStats={weeklyStats} />
        ) : null}

        {/* Streak Section */}
        {statsLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <StreakSection
            currentStreak={stats.currentStreak}
            longestStreak={stats.longestStreak}
            streakDays={stats.streakDays}
          />
        )}

        {/* Tabbed History Sections */}
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sessions">Learning Sessions</TabsTrigger>
            <TabsTrigger value="practice">Practice History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions" className="mt-4">
            <SessionHistorySection />
          </TabsContent>
          
          <TabsContent value="practice" className="mt-4">
            <PracticeHistoryList />
          </TabsContent>
        </Tabs>

        {/* Friends Leaderboard */}
        <FriendsLeaderboard />

        {/* Achievements */}
        <AchievementsSection />
      </div>
    </div>
  );
}