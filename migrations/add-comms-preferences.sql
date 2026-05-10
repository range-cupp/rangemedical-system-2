-- Add communication preference columns to patients table
-- Allows staff to opt patients out of specific channels and communication types

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_opt_out BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS call_opt_out BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS automations_opt_out BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS comms_notes TEXT,
  ADD COLUMN IF NOT EXISTS comms_updated_at TIMESTAMPTZ;

-- marketing_opt_out already exists on patients table (used by /api/unsubscribe)
