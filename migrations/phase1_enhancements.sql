-- Phase 1: Foundation & Patient Hub Enhancements
-- Range Medical System V2

-- Add direction column to comms_log for inbound/outbound tracking
ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';

-- Add index on service_logs.patient_id for faster per-patient queries
CREATE INDEX IF NOT EXISTS idx_service_logs_patient_id ON service_logs(patient_id);

-- Add index on purchases.patient_id for faster per-patient queries
CREATE INDEX IF NOT EXISTS idx_purchases_patient_id ON purchases(patient_id);

-- Add index on invoices.patient_id for faster per-patient queries
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
