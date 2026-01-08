-- Add topic-level theory content column
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS theory_content TEXT;

-- Add a comment explaining the column
COMMENT ON COLUMN public.topics.theory_content IS 'Complete theory page content for the topic, with sections for each subtopic. Displayed when Theory button is clicked from any lesson node.';