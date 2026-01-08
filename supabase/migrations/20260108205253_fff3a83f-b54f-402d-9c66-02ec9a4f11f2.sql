-- Create topic_mastery_tests table (stores test attempts)
CREATE TABLE public.topic_mastery_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER,
  questions JSONB NOT NULL DEFAULT '[]',
  answers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create topic_mastery_results table (stores results with theory breakdown)
CREATE TABLE public.topic_mastery_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  test_id UUID REFERENCES public.topic_mastery_tests(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  overall_percentage INTEGER NOT NULL,
  time_spent_minutes INTEGER,
  theory_block_scores JSONB NOT NULL DEFAULT '[]',
  weak_blocks UUID[] DEFAULT '{}',
  strong_blocks UUID[] DEFAULT '{}',
  subtopic_coverage JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topic_mastery_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topic_mastery_tests
CREATE POLICY "Users can view their own mastery tests"
ON public.topic_mastery_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mastery tests"
ON public.topic_mastery_tests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mastery tests"
ON public.topic_mastery_tests FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for topic_mastery_results
CREATE POLICY "Users can view their own mastery results"
ON public.topic_mastery_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mastery results"
ON public.topic_mastery_results FOR INSERT
WITH CHECK (auth.uid() = user_id);