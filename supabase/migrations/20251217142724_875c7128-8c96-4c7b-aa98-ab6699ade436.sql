-- Table to track student responses to understanding checks in conversational learning
CREATE TABLE public.learning_check_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subtopic_id UUID REFERENCES public.subtopics(id),
  subtopic_name TEXT NOT NULL,
  check_question TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  hint_used BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_check_responses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own responses
CREATE POLICY "Users can insert their own learning responses"
ON public.learning_check_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own responses
CREATE POLICY "Users can view their own learning responses"
ON public.learning_check_responses
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_learning_check_responses_user_subtopic 
ON public.learning_check_responses(user_id, subtopic_name);