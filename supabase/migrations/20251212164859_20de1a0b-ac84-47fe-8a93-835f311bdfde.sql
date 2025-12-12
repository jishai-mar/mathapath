-- Create diagnostic test status enum
CREATE TYPE public.diagnostic_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Create table for diagnostic test sessions
CREATE TABLE public.diagnostic_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  status diagnostic_status NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_questions INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Create table for diagnostic questions
CREATE TABLE public.diagnostic_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_test_id UUID NOT NULL REFERENCES public.diagnostic_tests(id) ON DELETE CASCADE,
  subtopic_id UUID NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  hints JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for diagnostic responses
CREATE TABLE public.diagnostic_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_question_id UUID NOT NULL REFERENCES public.diagnostic_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  misconception_tag TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for personalized learning profiles
CREATE TABLE public.learning_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  overall_level INTEGER NOT NULL DEFAULT 0 CHECK (overall_level >= 0 AND overall_level <= 100),
  subtopic_levels JSONB NOT NULL DEFAULT '{}'::jsonb,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  misconception_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_starting_subtopic UUID REFERENCES public.subtopics(id),
  learning_style_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Enable RLS
ALTER TABLE public.diagnostic_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for diagnostic_tests
CREATE POLICY "Users can view their own diagnostic tests"
  ON public.diagnostic_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagnostic tests"
  ON public.diagnostic_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnostic tests"
  ON public.diagnostic_tests FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for diagnostic_questions (viewable if user owns the test)
CREATE POLICY "Users can view questions for their tests"
  ON public.diagnostic_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.diagnostic_tests dt 
    WHERE dt.id = diagnostic_test_id AND dt.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert questions for their tests"
  ON public.diagnostic_questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.diagnostic_tests dt 
    WHERE dt.id = diagnostic_test_id AND dt.user_id = auth.uid()
  ));

-- RLS policies for diagnostic_responses
CREATE POLICY "Users can view their own responses"
  ON public.diagnostic_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON public.diagnostic_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for learning_profiles
CREATE POLICY "Users can view their own learning profile"
  ON public.learning_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning profile"
  ON public.learning_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning profile"
  ON public.learning_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_diagnostic_tests_updated_at
  BEFORE UPDATE ON public.diagnostic_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_profiles_updated_at
  BEFORE UPDATE ON public.learning_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();