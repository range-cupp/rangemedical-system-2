-- Add media_url column to comms_log for image/attachment support
-- Stores JSON array of URLs (e.g., '["https://..."]') or null
-- Run in Supabase SQL Editor

ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS media_url TEXT;
