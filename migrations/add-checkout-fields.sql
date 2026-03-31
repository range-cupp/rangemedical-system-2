-- Add verified_by and checkout_type to service_logs
-- verified_by: second set of eyes for HRT/weight loss dispensing
-- checkout_type: distinguishes medication checkout entries from manual service log entries

ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS checkout_type TEXT;
