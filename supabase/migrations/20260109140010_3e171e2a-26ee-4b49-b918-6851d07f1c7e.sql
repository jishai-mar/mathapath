-- Create friendships table for the friends leaderboard feature
CREATE TABLE public.user_friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.user_friendships ENABLE ROW LEVEL SECURITY;

-- Users can view their own friendships (where they are user or friend)
CREATE POLICY "Users can view own friendships" ON public.user_friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests" ON public.user_friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can respond to friend requests sent to them
CREATE POLICY "Users can update friend requests" ON public.user_friendships
  FOR UPDATE USING (auth.uid() = friend_id);

-- Users can delete their own friendships
CREATE POLICY "Users can delete own friendships" ON public.user_friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);