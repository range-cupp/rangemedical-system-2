-- Add encounter linking and note signing to patient_notes
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS appointment_id TEXT;
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS encounter_service TEXT;
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS signed_by TEXT;
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS parent_note_id UUID;

-- Index for efficient lookup of notes by appointment
CREATE INDEX IF NOT EXISTS idx_patient_notes_appointment_id
  ON patient_notes(appointment_id) WHERE appointment_id IS NOT NULL;

-- Index for addendum lookups
CREATE INDEX IF NOT EXISTS idx_patient_notes_parent_note_id
  ON patient_notes(parent_note_id) WHERE parent_note_id IS NOT NULL;
