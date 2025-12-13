-- Create a secure view for diagnostic questions that excludes correct_answer
CREATE OR REPLACE VIEW public.diagnostic_questions_public AS
SELECT 
  id,
  diagnostic_test_id,
  subtopic_id,
  question,
  difficulty,
  hints,
  order_index,
  created_at
FROM public.diagnostic_questions;

-- Grant SELECT access to the view for authenticated users
GRANT SELECT ON public.diagnostic_questions_public TO authenticated;
GRANT SELECT ON public.diagnostic_questions_public TO anon;

-- Drop the existing permissive SELECT policy on diagnostic_questions
DROP POLICY IF EXISTS "Users can view questions for their tests" ON public.diagnostic_questions;

-- Create a restrictive policy that only allows service role to SELECT from the full table
-- This prevents clients from reading correct_answer directly
CREATE POLICY "Only service role can read full questions"
ON public.diagnostic_questions
FOR SELECT
USING (false);  -- Clients cannot directly query this table

-- Keep the insert policy for edge functions
-- The existing insert policy should remain for edge functions using service role