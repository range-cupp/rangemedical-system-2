-- Add emr_entered flag to service_logs for tracking EMR entry status
-- Run in Supabase SQL Editor

ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS emr_entered BOOLEAN DEFAULT false;

-- Index for quickly finding pending EMR entries
CREATE INDEX IF NOT EXISTS idx_service_logs_emr_pending
  ON service_logs (emr_entered, category)
  WHERE emr_entered = false;
