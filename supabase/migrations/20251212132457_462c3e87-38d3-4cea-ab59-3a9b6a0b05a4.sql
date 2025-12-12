-- Create storage bucket for handwritten work
INSERT INTO storage.buckets (id, name, public)
VALUES ('handwritten-work', 'handwritten-work', false);

-- RLS policies for handwritten-work bucket
CREATE POLICY "Users can upload their own handwritten work"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'handwritten-work' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own handwritten work"
ON storage.objects
FOR SELECT
USING (bucket_id = 'handwritten-work' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own handwritten work"
ON storage.objects
FOR DELETE
USING (bucket_id = 'handwritten-work' AND auth.uid()::text = (storage.foldername(name))[1]);