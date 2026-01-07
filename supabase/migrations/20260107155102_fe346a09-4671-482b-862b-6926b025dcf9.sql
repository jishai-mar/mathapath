-- Create user_learning_goals table
CREATE TABLE public.user_learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_date DATE NOT NULL,
  topics_to_master UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_learning_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_learning_goals
CREATE POLICY "Users can view their own learning goals"
ON public.user_learning_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning goals"
ON public.user_learning_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning goals"
ON public.user_learning_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning goals"
ON public.user_learning_goals FOR DELETE
USING (auth.uid() = user_id);

-- Create learning_path_nodes table
CREATE TABLE public.learning_path_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID REFERENCES public.user_learning_goals(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id),
  subtopic_id UUID REFERENCES public.subtopics(id),
  scheduled_date DATE NOT NULL,
  target_difficulty TEXT DEFAULT 'easy' CHECK (target_difficulty IN ('easy', 'medium', 'hard', 'exam')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  order_index INTEGER NOT NULL,
  estimated_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_path_nodes ENABLE ROW LEVEL SECURITY;

-- RLS policies for learning_path_nodes
CREATE POLICY "Users can view their own path nodes"
ON public.learning_path_nodes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own path nodes"
ON public.learning_path_nodes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own path nodes"
ON public.learning_path_nodes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own path nodes"
ON public.learning_path_nodes FOR DELETE
USING (auth.uid() = user_id);

-- Create topic_prerequisites table
CREATE TABLE public.topic_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id),
  prerequisite_topic_id UUID NOT NULL REFERENCES public.topics(id),
  is_strong_dependency BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(topic_id, prerequisite_topic_id)
);

-- Enable RLS (read-only for all authenticated users)
ALTER TABLE public.topic_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topic prerequisites"
ON public.topic_prerequisites FOR SELECT
USING (true);

-- Create topic_exam_results table
CREATE TABLE public.topic_exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id),
  score_percentage INTEGER NOT NULL,
  questions_correct INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent_minutes INTEGER NOT NULL,
  is_exam_ready BOOLEAN NOT NULL DEFAULT false,
  subtopic_scores JSONB NOT NULL DEFAULT '{}',
  weak_subtopics UUID[] DEFAULT '{}',
  mistake_patterns JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topic_exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own topic exam results"
ON public.topic_exam_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topic exam results"
ON public.topic_exam_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add mastery tracking columns to user_subtopic_progress
ALTER TABLE public.user_subtopic_progress
ADD COLUMN IF NOT EXISTS easy_mastered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS medium_mastered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hard_mastered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exam_ready BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_difficulty TEXT DEFAULT 'easy',
ADD COLUMN IF NOT EXISTS consecutive_correct INTEGER DEFAULT 0;

-- Add learning path columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS target_mastery_date DATE,
ADD COLUMN IF NOT EXISTS learning_path_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create updated_at trigger for user_learning_goals
CREATE OR REPLACE FUNCTION public.update_learning_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_learning_goals_updated_at
BEFORE UPDATE ON public.user_learning_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_learning_goals_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_path_nodes_user_date ON public.learning_path_nodes(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_learning_path_nodes_goal ON public.learning_path_nodes(goal_id);
CREATE INDEX IF NOT EXISTS idx_topic_exam_results_user_topic ON public.topic_exam_results(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_goals_active ON public.user_learning_goals(user_id, is_active);