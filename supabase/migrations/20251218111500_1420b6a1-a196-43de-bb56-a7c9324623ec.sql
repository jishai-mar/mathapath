-- Create enum for item rarity
CREATE TYPE public.item_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- Create enum for item category
CREATE TYPE public.item_category AS ENUM ('accessory', 'outfit', 'background', 'effect');

-- Create enum for unlock requirement type
CREATE TYPE public.unlock_requirement_type AS ENUM ('xp', 'streak', 'exercises', 'mastery', 'topic_complete');

-- Create tutor customization items table (master list)
CREATE TABLE public.tutor_customization_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category item_category NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_key TEXT NOT NULL,
  rarity item_rarity NOT NULL DEFAULT 'common',
  unlock_requirement_type unlock_requirement_type NOT NULL,
  unlock_requirement_value INTEGER NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user unlocked items table
CREATE TABLE public.user_unlocked_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.tutor_customization_items(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.tutor_customization_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unlocked_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for tutor_customization_items (public read)
CREATE POLICY "Anyone can view customization items"
ON public.tutor_customization_items
FOR SELECT
USING (true);

-- RLS policies for user_unlocked_items
CREATE POLICY "Users can view their own unlocked items"
ON public.user_unlocked_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlocked items"
ON public.user_unlocked_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocked items"
ON public.user_unlocked_items
FOR UPDATE
USING (auth.uid() = user_id);

-- Add equipped items columns to user_tutor_preferences
ALTER TABLE public.user_tutor_preferences
ADD COLUMN equipped_accessory UUID REFERENCES public.tutor_customization_items(id),
ADD COLUMN equipped_outfit UUID REFERENCES public.tutor_customization_items(id),
ADD COLUMN equipped_background UUID REFERENCES public.tutor_customization_items(id),
ADD COLUMN equipped_effect UUID REFERENCES public.tutor_customization_items(id);

-- Seed initial customization items
INSERT INTO public.tutor_customization_items (category, name, description, icon_key, rarity, unlock_requirement_type, unlock_requirement_value, order_index) VALUES
-- Accessories (XP-based)
('accessory', 'Reading Glasses', 'Classic scholarly look', 'glasses', 'common', 'xp', 100, 1),
('accessory', 'Student Badge', 'First steps in learning', 'badge', 'common', 'xp', 250, 2),
('accessory', 'Headphones', 'Study in style', 'headphones', 'rare', 'xp', 1000, 3),
('accessory', 'Graduation Cap', 'Academic achievement', 'graduation-cap', 'rare', 'xp', 2500, 4),
('accessory', 'Crown', 'Math royalty', 'crown', 'epic', 'xp', 5000, 5),
('accessory', 'Golden Halo', 'Legendary dedication', 'halo', 'legendary', 'xp', 10000, 6),

-- Outfits (Topic mastery-based)
('outfit', 'Lab Coat', 'Ready for experiments', 'lab-coat', 'common', 'topic_complete', 1, 1),
('outfit', 'Scholar Vest', 'Casual academic style', 'vest', 'rare', 'topic_complete', 3, 2),
('outfit', 'Professor Blazer', 'Distinguished look', 'blazer', 'rare', 'topic_complete', 6, 3),
('outfit', 'Scholar Robe', 'Traditional wisdom', 'robe', 'epic', 'topic_complete', 9, 4),
('outfit', 'Math Wizard Cloak', 'Master of mathematics', 'wizard-cloak', 'legendary', 'topic_complete', 12, 5),

-- Backgrounds (Streak-based)
('background', 'Notebook Paper', 'Classic study vibes', 'notebook', 'common', 'streak', 3, 1),
('background', 'Chalkboard', 'Old school cool', 'chalkboard', 'common', 'streak', 7, 2),
('background', 'Library', 'Surrounded by knowledge', 'library', 'rare', 'streak', 14, 3),
('background', 'Starry Sky', 'Reaching for the stars', 'stars', 'rare', 'streak', 21, 4),
('background', 'Space Station', 'Out of this world', 'space', 'epic', 'streak', 30, 5),
('background', 'Galaxy', 'Cosmic mastery', 'galaxy', 'legendary', 'streak', 60, 6),

-- Effects (Exercise-based)
('effect', 'Subtle Sparkle', 'A touch of magic', 'sparkle', 'common', 'exercises', 25, 1),
('effect', 'Glow Aura', 'Radiant energy', 'glow', 'common', 'exercises', 50, 2),
('effect', 'Floating Numbers', 'Math in the air', 'numbers', 'rare', 'exercises', 100, 3),
('effect', 'Rainbow Trail', 'Colorful brilliance', 'rainbow', 'rare', 'exercises', 200, 4),
('effect', 'Lightning Sparks', 'Electric genius', 'lightning', 'epic', 'exercises', 350, 5),
('effect', 'Fire Aura', 'Blazing intellect', 'fire', 'legendary', 'exercises', 500, 6);