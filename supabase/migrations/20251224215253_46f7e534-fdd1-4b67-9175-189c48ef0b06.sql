-- Add personal_note column to student_session_notes table
ALTER TABLE public.student_session_notes 
ADD COLUMN personal_note TEXT DEFAULT NULL;