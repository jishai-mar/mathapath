-- Create bookmarks table for saving theory content
CREATE TABLE public.theory_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subtopic_id UUID REFERENCES public.subtopics(id) ON DELETE CASCADE,
  subtopic_name TEXT NOT NULL,
  bookmark_type TEXT NOT NULL DEFAULT 'definition', -- 'definition', 'rule', 'formula', 'example', 'note'
  content TEXT NOT NULL,
  note TEXT, -- optional user note
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theory_bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.theory_bookmarks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own bookmarks
CREATE POLICY "Users can create their own bookmarks"
ON public.theory_bookmarks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookmarks
CREATE POLICY "Users can update their own bookmarks"
ON public.theory_bookmarks
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
ON public.theory_bookmarks
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for fast lookups
CREATE INDEX idx_theory_bookmarks_user_id ON public.theory_bookmarks(user_id);
CREATE INDEX idx_theory_bookmarks_subtopic ON public.theory_bookmarks(subtopic_id);