-- Add new columns to profiles table for full profile functionality

-- Personal info columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_interest text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about_me text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Notification preference columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_weekly_progress boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_new_courses boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_community_mentions boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_daily_reminder boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_achievements boolean DEFAULT false;

-- Privacy preference columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_public_profile boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_usage_analytics boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_marketing_emails boolean DEFAULT false;