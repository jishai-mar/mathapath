-- Add columns to track struggle mastery progress
ALTER TABLE public.student_session_notes 
ADD COLUMN mastered_at timestamp with time zone DEFAULT NULL,
ADD COLUMN related_entry_id uuid REFERENCES public.student_session_notes(id) DEFAULT NULL;

-- Add index for faster queries on related entries
CREATE INDEX idx_session_notes_related_entry ON public.student_session_notes(related_entry_id) WHERE related_entry_id IS NOT NULL;

-- Add index for mastered struggles
CREATE INDEX idx_session_notes_mastered ON public.student_session_notes(mastered_at) WHERE mastered_at IS NOT NULL;