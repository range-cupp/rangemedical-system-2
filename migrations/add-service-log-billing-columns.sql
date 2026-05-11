-- Add billing flag columns to service_logs
-- Flags entries that were logged without a prepaid package covering the service

ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS needs_billing boolean DEFAULT false;
ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS billing_reason text;

-- Index for quick lookup of unbilled entries
CREATE INDEX IF NOT EXISTS idx_service_logs_needs_billing ON service_logs (needs_billing) WHERE needs_billing = true;
