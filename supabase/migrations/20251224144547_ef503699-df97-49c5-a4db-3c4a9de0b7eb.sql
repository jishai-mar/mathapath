-- Add columns for detailed session analytics
ALTER TABLE public.learning_sessions
ADD COLUMN IF NOT EXISTS difficulty_progression jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS exercise_timings jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS starting_difficulty text,
ADD COLUMN IF NOT EXISTS final_difficulty text,
ADD COLUMN IF NOT EXISTS average_time_per_exercise integer;