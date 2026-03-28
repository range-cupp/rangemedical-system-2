-- Add prep tracking fields to appointments table
-- Supports SOP: appointment creation workflow tracking
-- T-01: Schema migration

-- Modality enum type
DO $$ BEGIN
  CREATE TYPE appointment_modality AS ENUM ('in_clinic', 'telemedicine', 'phone');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS modality appointment_modality,
  ADD COLUMN IF NOT EXISTS visit_reason TEXT,
  ADD COLUMN IF NOT EXISTS instructions_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS forms_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS labs_delivered BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prereqs_met BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prep_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_briefed BOOLEAN NOT NULL DEFAULT false;

-- Comment columns for documentation
COMMENT ON COLUMN appointments.modality IS 'in_clinic, telemedicine, or phone';
COMMENT ON COLUMN appointments.visit_reason IS 'Free-text visit reason (enforced at UI level)';
COMMENT ON COLUMN appointments.instructions_sent IS 'Pre-visit instructions sent to patient';
COMMENT ON COLUMN appointments.forms_complete IS 'All required intake/consent forms completed';
COMMENT ON COLUMN appointments.labs_delivered IS 'Lab results delivered (print or email based on modality)';
COMMENT ON COLUMN appointments.prereqs_met IS 'Blood work and other prerequisites verified';
COMMENT ON COLUMN appointments.prep_complete IS 'Staff prep checklist completed';
COMMENT ON COLUMN appointments.provider_briefed IS 'Provider has been briefed on patient/visit';
