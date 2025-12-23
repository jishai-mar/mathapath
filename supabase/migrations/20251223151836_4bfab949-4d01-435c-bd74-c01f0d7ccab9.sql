-- Create table for storing student session notes (interests, struggles, breakthroughs)
CREATE TABLE public.student_session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('interest', 'struggle', 'breakthrough', 'emotional', 'learning_style')),
  content TEXT NOT NULL,
  subtopic_name TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_session_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_session_notes
CREATE POLICY "Users can view their own session notes"
ON public.student_session_notes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session notes"
ON public.student_session_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session notes"
ON public.student_session_notes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session notes"
ON public.student_session_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Add learning-related columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS detected_learning_style TEXT,
ADD COLUMN IF NOT EXISTS last_session_mood TEXT,
ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 0;