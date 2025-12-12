-- Create enum for difficulty levels
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Create topics table
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'calculator',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subtopics table
CREATE TABLE public.subtopics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subtopic_id UUID NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  hints TEXT[],
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_practice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user topic progress table
CREATE TABLE public.user_topic_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  mastery_percentage INTEGER NOT NULL DEFAULT 0,
  exercises_completed INTEGER NOT NULL DEFAULT 0,
  exercises_correct INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Create exercise attempts table
CREATE TABLE public.exercise_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  ai_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

-- Topics, subtopics, exercises are readable by everyone (public content)
CREATE POLICY "Topics are viewable by everyone" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Subtopics are viewable by everyone" ON public.subtopics FOR SELECT USING (true);
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises FOR SELECT USING (true);

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User topic progress policies
CREATE POLICY "Users can view their own progress" ON public.user_topic_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_topic_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_topic_progress FOR UPDATE USING (auth.uid() = user_id);

-- Exercise attempts policies
CREATE POLICY "Users can view their own attempts" ON public.exercise_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts" ON public.exercise_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_topic_progress_updated_at
  BEFORE UPDATE ON public.user_topic_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 12 topics from the exercise booklet
INSERT INTO public.topics (name, description, icon, order_index) VALUES
  ('Linear Equations', 'Single variable, two variables, and parametric equations', 'equal', 1),
  ('Fractions & Algebraic Expressions', 'Simplifying and manipulating algebraic fractions', 'divide', 2),
  ('Quadratic Equations', 'Standard, parametric, and biquadratic equations', 'square', 3),
  ('Radical Equations', 'Equations involving square roots and radicals', 'radical', 4),
  ('Higher Degree Equations', 'Polynomial equations of degree 3 and higher', 'trending-up', 5),
  ('Inequalities', 'First and second degree inequalities', 'chevrons-left-right', 6),
  ('Exponents', 'Exponential equations and properties', 'superscript', 7),
  ('Logarithms', 'Logarithmic equations and properties', 'log-in', 8),
  ('Linear Functions', 'Lines, slopes, and linear graphs', 'move-diagonal', 9),
  ('Quadratic Functions', 'Parabolas and their properties', 'arc', 10),
  ('Limits', 'Limits and continuity', 'infinity', 11),
  ('Derivatives', 'Differentiation and applications', 'activity', 12);

-- Insert subtopics for each topic
INSERT INTO public.subtopics (topic_id, name, order_index)
SELECT t.id, s.name, s.order_index
FROM public.topics t
CROSS JOIN LATERAL (
  SELECT * FROM (VALUES
    ('Linear Equations', 'Single Variable Equations', 1),
    ('Linear Equations', 'Two Variable Systems', 2),
    ('Linear Equations', 'Parametric Equations', 3),
    ('Fractions & Algebraic Expressions', 'Simplifying Fractions', 1),
    ('Fractions & Algebraic Expressions', 'Operations with Fractions', 2),
    ('Quadratic Equations', 'Standard Form', 1),
    ('Quadratic Equations', 'Factoring', 2),
    ('Quadratic Equations', 'Quadratic Formula', 3),
    ('Quadratic Equations', 'Parametric Quadratics', 4),
    ('Radical Equations', 'Square Root Equations', 1),
    ('Radical Equations', 'Higher Order Radicals', 2),
    ('Higher Degree Equations', 'Cubic Equations', 1),
    ('Higher Degree Equations', 'Polynomial Division', 2),
    ('Inequalities', 'Linear Inequalities', 1),
    ('Inequalities', 'Quadratic Inequalities', 2),
    ('Inequalities', 'Rational Inequalities', 3),
    ('Exponents', 'Exponential Properties', 1),
    ('Exponents', 'Exponential Equations', 2),
    ('Logarithms', 'Logarithmic Properties', 1),
    ('Logarithms', 'Logarithmic Equations', 2),
    ('Linear Functions', 'Slope and Intercept', 1),
    ('Linear Functions', 'Line Equations', 2),
    ('Linear Functions', 'Parallel and Perpendicular', 3),
    ('Quadratic Functions', 'Vertex Form', 1),
    ('Quadratic Functions', 'Graphing Parabolas', 2),
    ('Quadratic Functions', 'Applications', 3),
    ('Limits', 'Basic Limits', 1),
    ('Limits', 'Limits at Infinity', 2),
    ('Limits', 'Continuity', 3),
    ('Derivatives', 'Basic Derivatives', 1),
    ('Derivatives', 'Chain Rule', 2),
    ('Derivatives', 'Applications', 3)
  ) AS sub(topic_name, name, order_index)
) s
WHERE t.name = s.topic_name;