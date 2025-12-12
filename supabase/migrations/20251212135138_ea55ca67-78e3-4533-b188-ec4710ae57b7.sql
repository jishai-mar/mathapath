-- Add theory content columns to subtopics
ALTER TABLE public.subtopics 
ADD COLUMN IF NOT EXISTS theory_explanation text,
ADD COLUMN IF NOT EXISTS worked_examples jsonb DEFAULT '[]'::jsonb;

-- Add hints_used tracking to exercise_attempts
ALTER TABLE public.exercise_attempts 
ADD COLUMN IF NOT EXISTS hints_used integer DEFAULT 0;

-- Create user_subtopic_progress table for fine-grained analytics
CREATE TABLE IF NOT EXISTS public.user_subtopic_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subtopic_id uuid NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
  exercises_completed integer NOT NULL DEFAULT 0,
  exercises_correct integer NOT NULL DEFAULT 0,
  hints_used integer NOT NULL DEFAULT 0,
  mastery_percentage integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, subtopic_id)
);

-- Enable RLS on user_subtopic_progress
ALTER TABLE public.user_subtopic_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subtopic_progress
CREATE POLICY "Users can view their own subtopic progress"
ON public.user_subtopic_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subtopic progress"
ON public.user_subtopic_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subtopic progress"
ON public.user_subtopic_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on user_subtopic_progress
CREATE TRIGGER update_user_subtopic_progress_updated_at
BEFORE UPDATE ON public.user_subtopic_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed theory content for demo subtopics
UPDATE public.subtopics 
SET 
  theory_explanation = 'A **linear equation** in one variable has the form $ax + b = c$ where $a$, $b$, and $c$ are constants. To solve, isolate $x$ by performing inverse operations on both sides:

1. **Addition/Subtraction**: Move constant terms to one side
2. **Multiplication/Division**: Isolate the variable

The key principle: whatever you do to one side, do to the other!',
  worked_examples = '[
    {
      "problem": "Solve: $3x + 5 = 14$",
      "steps": [
        "Subtract 5 from both sides: $3x + 5 - 5 = 14 - 5$",
        "Simplify: $3x = 9$",
        "Divide both sides by 3: $\\\\frac{3x}{3} = \\\\frac{9}{3}$",
        "Solution: $x = 3$"
      ],
      "answer": "$x = 3$"
    },
    {
      "problem": "Solve: $2(x - 4) = 10$",
      "steps": [
        "Distribute: $2x - 8 = 10$",
        "Add 8 to both sides: $2x = 18$",
        "Divide by 2: $x = 9$"
      ],
      "answer": "$x = 9$"
    }
  ]'::jsonb
WHERE name ILIKE '%single variable%' OR name ILIKE '%linear%equation%';

UPDATE public.subtopics 
SET 
  theory_explanation = 'A **quadratic equation** has the form $ax^2 + bx + c = 0$. There are three main methods to solve:

1. **Factoring**: Write as $(x - r_1)(x - r_2) = 0$
2. **Quadratic Formula**: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
3. **Completing the Square**: Transform to $(x + p)^2 = q$

The **discriminant** $\\Delta = b^2 - 4ac$ determines the nature of roots:
- $\\Delta > 0$: Two distinct real roots
- $\\Delta = 0$: One repeated root
- $\\Delta < 0$: No real roots',
  worked_examples = '[
    {
      "problem": "Solve: $x^2 - 5x + 6 = 0$",
      "steps": [
        "Factor: Find two numbers that multiply to 6 and add to -5",
        "Those numbers are -2 and -3",
        "Write as: $(x - 2)(x - 3) = 0$",
        "Set each factor to zero: $x - 2 = 0$ or $x - 3 = 0$"
      ],
      "answer": "$x = 2$ or $x = 3$"
    },
    {
      "problem": "Solve: $2x^2 + 4x - 6 = 0$",
      "steps": [
        "Use quadratic formula with $a=2$, $b=4$, $c=-6$",
        "$x = \\\\frac{-4 \\\\pm \\\\sqrt{16 + 48}}{4}$",
        "$x = \\\\frac{-4 \\\\pm 8}{4}$",
        "$x = 1$ or $x = -3$"
      ],
      "answer": "$x = 1$ or $x = -3$"
    }
  ]'::jsonb
WHERE name ILIKE '%factor%' OR name ILIKE '%quadratic%';