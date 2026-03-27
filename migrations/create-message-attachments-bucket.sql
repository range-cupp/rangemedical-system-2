-- Create Supabase Storage bucket for message attachments (images)
-- Run in Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads (images need to be accessible via URL for iMessage/SMS)
CREATE POLICY "Public read access for message attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');

-- Allow authenticated uploads (service role key handles this server-side)
CREATE POLICY "Service role upload for message attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'message-attachments');
