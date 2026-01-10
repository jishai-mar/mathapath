import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Target, TrendingUp, ChevronDown, ChevronUp,
  Brain, Sparkles, MessageSquare, Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

interface LearningSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  session_goal: string | null;
  topics_covered: string[] | null;
  problems_solved: number | null;
  correct_answers: number | null;
  hints_used: number | null;
  session_summary: string | null;
  xp_earned: number | null;
  starting_difficulty: string | null;
  final_difficulty: string | null;
}

export function SessionHistorySection() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      if (!user) return;

      const { data, error } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching sessions:', error);
      } else {
        setSessions((data as LearningSession[]) || []);
      }
      setLoading(false);
    }

    fetchSessions();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Learning Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Learning Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No learning sessions yet</p>
            <p className="text-sm">Start a guided session from the dashboard!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Learning Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session, index) => {
          const isExpanded = expandedSession === session.id;
          const accuracy = session.problems_solved && session.problems_solved > 0
            ? Math.round(((session.correct_answers || 0) / session.problems_solved) * 100)
            : 0;
          
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                className="w-full text-left"
              >
                <div className={`p-4 rounded-xl border transition-all ${
                  isExpanded 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}>
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {session.session_goal || 'Practice Session'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.xp_earned && session.xp_earned > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="w-3 h-3" />
                          +{session.xp_earned} XP
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold">{session.duration_minutes || 0}m</p>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{session.problems_solved || 0}</p>
                      <p className="text-xs text-muted-foreground">Problems</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${accuracy >= 70 ? 'text-green-500' : accuracy >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {accuracy}%
                      </p>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="mt-3">
                    <Progress value={accuracy} className="h-1.5" />
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-4 pt-4 border-t border-border space-y-4"
                    >
                      {/* Session Summary */}
                      {session.session_summary && (
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 text-xs text-primary font-medium mb-2">
                            <MessageSquare className="w-3 h-3" />
                            AI Summary
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.session_summary}
                          </p>
                        </div>
                      )}

                      {/* Topics Covered */}
                      {session.topics_covered && session.topics_covered.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-2">Topics Covered</p>
                          <div className="flex flex-wrap gap-2">
                            {session.topics_covered.map((topic, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Difficulty Progression */}
                      {(session.starting_difficulty || session.final_difficulty) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Difficulty:</span>
                          <Badge variant="outline" className="capitalize">
                            {session.starting_difficulty || 'N/A'}
                          </Badge>
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <Badge variant="outline" className="capitalize">
                            {session.final_difficulty || 'N/A'}
                          </Badge>
                        </div>
                      )}

                      {/* Additional Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>Started: {format(new Date(session.started_at), 'MMM d, h:mm a')}</span>
                        </div>
                        {session.hints_used !== null && (
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-muted-foreground" />
                            <span>{session.hints_used} hints used</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
