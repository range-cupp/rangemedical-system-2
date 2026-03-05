-- Add pinned column to patient_notes for pin-to-top feature
-- Run in Supabase SQL Editor

ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- Partial index for efficient lookup of the pinned note per patient
CREATE INDEX IF NOT EXISTS idx_patient_notes_pinned
  ON patient_notes(patient_id) WHERE pinned = true;
