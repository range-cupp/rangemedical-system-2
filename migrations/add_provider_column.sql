-- Add provider column to comms_log for multi-provider tracking (Twilio + Blooio)
-- Run this in Supabase SQL Editor
-- Range Medical

ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'twilio';
CREATE INDEX IF NOT EXISTS idx_comms_log_provider ON comms_log(provider);
