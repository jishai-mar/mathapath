import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Friend {
  id: string;
  friendshipId: string;
  display_name: string | null;
  current_streak: number;
  longest_streak: number;
  status: 'pending' | 'accepted' | 'rejected';
  isIncoming: boolean;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch friendships where user is involved
      const { data: friendships, error } = await supabase
        .from('user_friendships')
        .select('id, user_id, friend_id, status')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (error) throw error;

      if (!friendships || friendships.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Get all unique friend IDs
      const friendIds = friendships.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      // Fetch friend profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, current_streak, longest_streak')
        .in('id', friendIds);

      const friendsList: Friend[] = friendships.map(friendship => {
        const friendId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
        const profile = profiles?.find(p => p.id === friendId);
        
        return {
          id: friendId,
          friendshipId: friendship.id,
          display_name: profile?.display_name || 'Anonymous',
          current_streak: profile?.current_streak || 0,
          longest_streak: profile?.longest_streak || 0,
          status: friendship.status as 'pending' | 'accepted' | 'rejected',
          isIncoming: friendship.friend_id === user.id,
        };
      });

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('user_friendships')
      .insert({ user_id: user.id, friend_id: friendId });

    if (!error) {
      await fetchFriends();
    }
    return { error: error?.message || null };
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('user_friendships')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriends();
    }
    return { error: error?.message || null };
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('user_friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriends();
    }
    return { error: error?.message || null };
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('user_friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriends();
    }
    return { error: error?.message || null };
  };

  const acceptedFriends = friends.filter(f => f.status === 'accepted');
  const pendingRequests = friends.filter(f => f.status === 'pending' && f.isIncoming);

  return {
    friends,
    acceptedFriends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refetch: fetchFriends,
  };
}
