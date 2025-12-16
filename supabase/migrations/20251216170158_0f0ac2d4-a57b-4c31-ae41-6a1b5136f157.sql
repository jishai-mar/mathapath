-- Fix security definer views by recreating them with SECURITY INVOKER
-- This ensures RLS policies are applied based on the querying user, not the view creator

-- Drop existing views
DROP VIEW IF EXISTS public.diagnostic_questions_public;
DROP VIEW IF EXISTS public.exercises_public;

-- Recreate diagnostic_questions_public view with SECURITY INVOKER
CREATE VIEW public.diagnostic_questions_public
WITH (security_invoker = true)
AS SELECT 
  id,
  diagnostic_test_id,
  subtopic_id,
  question,
  difficulty,
  hints,
  order_index,
  created_at
FROM public.diagnostic_questions;

-- Recreate exercises_public view with SECURITY INVOKER
CREATE VIEW public.exercises_public
WITH (security_invoker = true)
AS SELECT
  id,
  subtopic_id,
  question,
  difficulty,
  hints,
  created_at
FROM public.exercises;

-- Grant SELECT permissions on the views to authenticated and anon users
GRANT SELECT ON public.diagnostic_questions_public TO authenticated, anon;
GRANT SELECT ON public.exercises_public TO authenticated, anon;