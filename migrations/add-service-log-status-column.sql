-- Add status column to service_logs
-- Tracks whether an entry is completed or scheduled (future take-home injections)
-- Existing entries default to 'completed'

ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';

-- Index for quick lookup of scheduled entries (used by auto-complete cron)
CREATE INDEX IF NOT EXISTS idx_service_logs_scheduled ON service_logs (status, entry_date) WHERE status = 'scheduled';
