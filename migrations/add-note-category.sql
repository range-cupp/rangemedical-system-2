-- Add note_category column to separate clinical chart notes from internal staff notes
-- 'clinical' = encounter notes, signed notes, protocol notes — included in printed charts
-- 'internal' = staff notes, operational notes — NOT included in printed charts

ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS note_category TEXT DEFAULT 'clinical';

-- Backfill existing notes based on source
UPDATE patient_notes SET note_category = 'clinical' WHERE source IN ('encounter', 'addendum', 'protocol');
UPDATE patient_notes SET note_category = 'internal' WHERE source IN ('manual', 'ghl_backup');

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_patient_notes_category ON patient_notes(patient_id, note_category);
