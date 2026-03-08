-- Add protocol linking columns to patient_notes
-- Allows notes created from a protocol detail page to be linked back to that protocol
-- Range Medical - 2026-03-08

ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS protocol_id UUID REFERENCES protocols(id) ON DELETE SET NULL;
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS protocol_name TEXT;

-- Index for efficient lookup of notes by protocol
CREATE INDEX IF NOT EXISTS idx_patient_notes_protocol_id ON patient_notes(protocol_id) WHERE protocol_id IS NOT NULL;
