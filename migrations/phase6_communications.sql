-- Phase 6: Communications & Polish
-- Range Medical System V2
-- Run this migration against your Supabase database

-- Add direction and Twilio fields to comms_log
ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';
ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS twilio_message_sid TEXT;

-- Index for conversation view lookups
CREATE INDEX IF NOT EXISTS idx_comms_log_patient_channel ON comms_log(patient_id, channel);
CREATE INDEX IF NOT EXISTS idx_comms_log_direction ON comms_log(direction);
