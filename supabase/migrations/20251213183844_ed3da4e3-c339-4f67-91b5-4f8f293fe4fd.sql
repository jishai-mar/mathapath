-- Create a secure view for exercises that excludes correct_answer and explanation
CREATE OR REPLACE VIEW public.exercises_public AS
SELECT 
  id,
  subtopic_id,
  question,
  difficulty,
  hints,
  created_at
FROM public.exercises;

-- Grant SELECT access to the view
GRANT SELECT ON public.exercises_public TO authenticated;
GRANT SELECT ON public.exercises_public TO anon;

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Exercises are viewable by everyone" ON public.exercises;

-- Create restrictive policy - only service role can read full exercise data
CREATE POLICY "Only service role can read full exercises"
ON public.exercises
FOR SELECT
USING (false);

-- The existing insert restrictions remain (no INSERT policy exists)