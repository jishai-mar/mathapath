-- Create table to store level assessment quiz results
CREATE TABLE public.level_assessment_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_spent_minutes INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  total_parts INTEGER NOT NULL,
  answered_parts INTEGER NOT NULL,
  overall_percentage INTEGER NOT NULL,
  topics_assessed JSONB NOT NULL DEFAULT '[]'::jsonb,
  topic_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  strong_topics TEXT[] DEFAULT '{}',
  weak_topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.level_assessment_results ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own assessment results" 
ON public.level_assessment_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessment results" 
ON public.level_assessment_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_level_assessment_results_user_id ON public.level_assessment_results(user_id);
CREATE INDEX idx_level_assessment_results_completed_at ON public.level_assessment_results(completed_at DESC);