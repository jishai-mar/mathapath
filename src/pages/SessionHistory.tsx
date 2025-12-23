import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  TrendingUp, 
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  Brain,
  Timer
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';

interface LearningSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  session_goal: string | null;
  topics_covered: string[] | null;
  problems_solved: number;
  hints_used: number;
  correct_answers: number;
  total_attempts: number;
  dominant_emotion: string | null;
  session_summary: string | null;
  xp_earned: number;
  duration_minutes: number | null;
}

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  totalProblems: number;
  totalCorrect: number;
  totalAttempts: number;
  totalXp: number;
  uniqueTopics: string[];
  avgSessionMinutes: number;
  accuracyRate: number;
}

const emotionEmojis: Record<string, string> = {
  neutral: '😊',
  engaged: '🤩',
  struggling: '🤔',
  frustrated: '😓',
  confident: '😎',
  anxious: '😰',
};

export default function SessionHistory() {
  const { user } = useAuth();
  const { getSessionHistory, getSessionStats } = useSessionTracking();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      
      const [historyData, statsData] = await Promise.all([
        getSessionHistory(50),
        getSessionStats(),
      ]);
      
      setSessions(historyData as LearningSession[]);
      setStats(statsData);
      setIsLoading(false);
    };

    loadData();
  }, [user, getSessionHistory, getSessionStats]);

  const groupSessionsByDate = (sessions: LearningSession[]) => {
    const groups: { label: string; sessions: LearningSession[] }[] = [];
    const today: LearningSession[] = [];
    const yesterday: LearningSession[] = [];
    const thisWeek: LearningSession[] = [];
    const older: LearningSession[] = [];

    sessions.forEach(session => {
      const date = new Date(session.started_at);
      if (isToday(date)) {
        today.push(session);
      } else if (isYesterday(date)) {
        yesterday.push(session);
      } else if (isThisWeek(date)) {
        thisWeek.push(session);
      } else {
        older.push(session);
      }
    });

    if (today.length > 0) groups.push({ label: 'Today', sessions: today });
    if (yesterday.length > 0) groups.push({ label: 'Yesterday', sessions: yesterday });
    if (thisWeek.length > 0) groups.push({ label: 'This Week', sessions: thisWeek });
    if (older.length > 0) groups.push({ label: 'Earlier', sessions: older });

    return groups;
  };

  const sessionGroups = groupSessionsByDate(sessions);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please log in to view your session history</p>
          <Button asChild>
            <Link to="/auth">Log In</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Session History</h1>
            <p className="text-muted-foreground">Track your learning journey over time</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalSessions}</p>
                      <p className="text-xs text-muted-foreground">Total Sessions</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Timer className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalMinutes}</p>
                      <p className="text-xs text-muted-foreground">Minutes Studied</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Award className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalXp}</p>
                      <p className="text-xs text-muted-foreground">XP Earned</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.accuracyRate}%</p>
                      <p className="text-xs text-muted-foreground">Accuracy Rate</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Progress Summary */}
            {stats && stats.uniqueTopics.length > 0 && (
              <Card className="mb-8">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Topics Explored
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stats.uniqueTopics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session List */}
            {sessions.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start a tutoring session to see your history here
                  </p>
                  <Button asChild>
                    <Link to="/dashboard">Start Learning</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {sessionGroups.map((group) => (
                  <div key={group.label}>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {group.label}
                    </h2>
                    <div className="space-y-3">
                      {group.sessions.map((session) => (
                        <SessionCard key={session.id} session={session} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: LearningSession }) {
  const startDate = new Date(session.started_at);
  const accuracy = session.total_attempts > 0 
    ? Math.round((session.correct_answers / session.total_attempts) * 100) 
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Session header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">
                {format(startDate, 'h:mm a')}
              </span>
              {session.duration_minutes && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {session.duration_minutes} min
                </Badge>
              )}
              {session.dominant_emotion && (
                <span className="text-lg" title={session.dominant_emotion}>
                  {emotionEmojis[session.dominant_emotion] || '😊'}
                </span>
              )}
            </div>

            {/* Goal */}
            {session.session_goal && (
              <div className="flex items-start gap-2 mb-2">
                <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {session.session_goal}
                </p>
              </div>
            )}

            {/* Topics */}
            {session.topics_covered && session.topics_covered.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {session.topics_covered.slice(0, 3).map((topic, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
                {session.topics_covered.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{session.topics_covered.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Summary */}
            {session.session_summary && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {session.session_summary}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {session.total_attempts > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{session.correct_answers}/{session.total_attempts} correct</span>
                </div>
              )}
              {session.xp_earned > 0 && (
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>+{session.xp_earned} XP</span>
                </div>
              )}
            </div>
          </div>

          {/* Accuracy indicator */}
          {session.total_attempts > 0 && (
            <div className="text-center">
              <div className="relative w-14 h-14">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/20"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${accuracy * 1.51} 151`}
                    className={accuracy >= 70 ? 'text-emerald-500' : accuracy >= 40 ? 'text-amber-500' : 'text-red-500'}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {accuracy}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
