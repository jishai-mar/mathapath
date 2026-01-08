-- Add media generation fields to theory_blocks table
ALTER TABLE theory_blocks ADD COLUMN IF NOT EXISTS narration_script TEXT;
ALTER TABLE theory_blocks ADD COLUMN IF NOT EXISTS narration_voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL';
ALTER TABLE theory_blocks ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'none' 
  CHECK (video_status IN ('none', 'pending', 'processing', 'ready', 'failed'));
ALTER TABLE theory_blocks ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE theory_blocks ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE theory_blocks ADD COLUMN IF NOT EXISTS visual_plan JSONB;
ALTER TABLE theory_blocks ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMPTZ;
ALTER TABLE theory_blocks ADD COLUMN IF NOT EXISTS generation_error TEXT;
ALTER TABLE theory_blocks ADD COLUMN IF NOT EXISTS generation_mode TEXT DEFAULT 'fallback'
  CHECK (generation_mode IN ('full', 'fallback'));

-- Create media generation job queue table
CREATE TABLE IF NOT EXISTS theory_block_media_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theory_block_id UUID NOT NULL REFERENCES theory_blocks(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('narration', 'audio', 'video', 'full')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create index for efficient job processing
CREATE INDEX IF NOT EXISTS idx_media_jobs_pending ON theory_block_media_jobs(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_media_jobs_block_id ON theory_block_media_jobs(theory_block_id);

-- Enable RLS on jobs table
ALTER TABLE theory_block_media_jobs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to jobs (for status checking)
CREATE POLICY "Public read access for media jobs" ON theory_block_media_jobs 
  FOR SELECT USING (true);

-- Create storage bucket for theory media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'theory-media', 
  'theory-media', 
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'video/mp4', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access for theory media bucket
CREATE POLICY "Public read access for theory media" ON storage.objects 
  FOR SELECT USING (bucket_id = 'theory-media');

-- Allow service role / anon to insert media (edge functions run as anon)
CREATE POLICY "Allow insert for theory media" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'theory-media');

-- Allow update for theory media
CREATE POLICY "Allow update for theory media" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'theory-media');