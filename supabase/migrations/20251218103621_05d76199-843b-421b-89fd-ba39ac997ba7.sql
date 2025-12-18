-- Create user_tutor_preferences table for tutor customization
CREATE TABLE public.user_tutor_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tutor_name TEXT DEFAULT 'Alex',
  avatar_style TEXT DEFAULT 'friendly-robot',
  personality TEXT DEFAULT 'patient',
  chat_theme TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_tutor_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tutor preferences"
ON public.user_tutor_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutor preferences"
ON public.user_tutor_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutor preferences"
ON public.user_tutor_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_tutor_preferences_updated_at
BEFORE UPDATE ON public.user_tutor_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();