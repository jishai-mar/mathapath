-- Theory blocks table for structured, rigorous theory content
CREATE TABLE theory_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN (
    'definition', 'theorem', 'property', 'method', 
    'worked-example', 'visual', 'proof', 'remark'
  )),
  block_number TEXT, -- e.g., "D1", "T2", "M1" for referencing
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  latex_content TEXT,
  prerequisites TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(topic_id, order_index)
);

-- Enable RLS
ALTER TABLE theory_blocks ENABLE ROW LEVEL SECURITY;

-- Public read access for theory blocks
CREATE POLICY "Theory blocks are viewable by everyone" 
ON theory_blocks FOR SELECT USING (true);

-- Link exercises to specific theory blocks they require
CREATE TABLE exercise_theory_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  theory_block_id UUID REFERENCES theory_blocks(id) ON DELETE CASCADE,
  relevance TEXT NOT NULL DEFAULT 'primary' CHECK (relevance IN ('primary', 'secondary', 'reference')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exercise_id, theory_block_id)
);

-- Enable RLS
ALTER TABLE exercise_theory_links ENABLE ROW LEVEL SECURITY;

-- Public read access for exercise-theory links
CREATE POLICY "Exercise theory links are viewable by everyone" 
ON exercise_theory_links FOR SELECT USING (true);

-- Add concepts_tested column to exercises for explicit concept tracking
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS concepts_tested TEXT[];

-- Add requires_visual column to indicate if exercise needs graphical understanding
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS requires_visual BOOLEAN DEFAULT false;

-- Create index for faster theory block lookups by topic
CREATE INDEX idx_theory_blocks_topic_id ON theory_blocks(topic_id);
CREATE INDEX idx_theory_blocks_block_type ON theory_blocks(block_type);

-- Create index for faster exercise-theory link lookups
CREATE INDEX idx_exercise_theory_links_exercise_id ON exercise_theory_links(exercise_id);
CREATE INDEX idx_exercise_theory_links_theory_block_id ON exercise_theory_links(theory_block_id);