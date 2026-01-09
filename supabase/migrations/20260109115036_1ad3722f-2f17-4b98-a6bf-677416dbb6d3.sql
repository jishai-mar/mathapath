-- Fix function search_path vulnerability for update_learning_goals_updated_at
CREATE OR REPLACE FUNCTION public.update_learning_goals_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;