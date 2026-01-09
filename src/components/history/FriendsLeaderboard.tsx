import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Flame, Trophy, UserPlus } from 'lucide-react';
import { useFriends, Friend } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export function FriendsLeaderboard() {
  const { user } = useAuth();
  const { acceptedFriends, loading } = useFriends();

  // Sort friends by current streak
  const sortedFriends = [...acceptedFriends].sort((a, b) => b.current_streak - a.current_streak);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sortedFriends.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-2">No friends yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add friends to see their streaks and compete on the leaderboard!
          </p>
          <Button variant="outline" disabled>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Friends (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedFriends.map((friend, index) => (
          <FriendRow key={friend.id} friend={friend} rank={index + 1} />
        ))}
      </CardContent>
    </Card>
  );
}

interface FriendRowProps {
  friend: Friend;
  rank: number;
}

function FriendRow({ friend, rank }: FriendRowProps) {
  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-amber-500" />;
    if (rank === 2) return <Trophy className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-4 w-4 text-amber-700" />;
    return <span className="text-sm text-muted-foreground w-4 text-center">{rank}</span>;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-center w-6">
        {getRankIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{friend.display_name || 'Anonymous'}</p>
        <p className="text-xs text-muted-foreground">
          Best: {friend.longest_streak} days
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <Flame className={`h-4 w-4 ${friend.current_streak > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
        <span className={`font-bold ${friend.current_streak > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
          {friend.current_streak}
        </span>
      </div>
    </div>
  );
}
