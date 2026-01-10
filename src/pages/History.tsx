import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHistoryStats } from '@/hooks/useHistoryStats';
import { SummaryStats } from '@/components/history/SummaryStats';
import { StreakSection } from '@/components/history/StreakSection';
import { FriendsLeaderboard } from '@/components/history/FriendsLeaderboard';
import { PracticeHistoryList } from '@/components/history/PracticeHistoryList';
import { AchievementsSection } from '@/components/history/AchievementsSection';
import { SessionHistorySection } from '@/components/history/SessionHistorySection';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function History() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useHistoryStats();

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

        {/* Summary Stats */}
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