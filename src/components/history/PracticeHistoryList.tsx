import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { usePracticeHistory, TimeFilter, PracticeEntry } from '@/hooks/usePracticeHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useState } from 'react';

export function PracticeHistoryList() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const { history, loading } = usePracticeHistory(timeFilter);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Practice History</CardTitle>
          <Skeleton className="h-9 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Practice History
        </CardTitle>
        <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No practice history found</p>
            <p className="text-sm mt-1">Start practicing to see your history here!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map(group => (
              <div key={group.date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.entries.map(entry => (
                    <PracticeRow key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PracticeRowProps {
  entry: PracticeEntry;
}

function PracticeRow({ entry }: PracticeRowProps) {
  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    hard: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0">
        {entry.isCorrect ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{entry.topicName}</p>
          <Badge variant="outline" className={difficultyColors[entry.difficulty]}>
            {entry.difficulty}
          </Badge>
        </div>
        {entry.subtopicName && (
          <p className="text-sm text-muted-foreground truncate">{entry.subtopicName}</p>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {entry.hintsUsed > 0 && (
          <div className="flex items-center gap-1">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>{entry.hintsUsed}</span>
          </div>
        )}
        <span className="text-xs">
          {format(new Date(entry.createdAt), 'h:mm a')}
        </span>
      </div>
    </div>
  );
}
