-- Add comprehensive diagnostic tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS comprehensive_diagnostic_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS comprehensive_diagnostic_completed_at timestamp with time zone;