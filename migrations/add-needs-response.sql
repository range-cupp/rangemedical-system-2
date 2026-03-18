-- Add needs_response column to comms_log
-- Tracks whether an inbound message still needs a human staff response
-- Automations do NOT clear this flag — only staff replies do
-- Run in Supabase SQL Editor

ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS needs_response BOOLEAN DEFAULT FALSE;

-- Set needs_response = true for all recent unresponded inbound messages
-- (last 30 days of inbound messages that don't have a staff reply after them)
UPDATE comms_log
SET needs_response = true
WHERE direction = 'inbound'
  AND channel = 'sms'
  AND message_type = 'inbound_sms'
  AND created_at > NOW() - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM comms_log AS reply
    WHERE reply.patient_id = comms_log.patient_id
      AND reply.direction = 'outbound'
      AND reply.source LIKE 'send-sms%'
      AND reply.created_at > comms_log.created_at
  );

-- Index for fast needs_response queries
CREATE INDEX IF NOT EXISTS idx_comms_log_needs_response
  ON comms_log(needs_response) WHERE needs_response = true;

-- Composite index for conversation list queries
CREATE INDEX IF NOT EXISTS idx_comms_log_patient_needs_response
  ON comms_log(patient_id, needs_response) WHERE needs_response = true;
