-- Add visit_group_id to patient_notes
-- Groups multiple encounter notes from the same visit (e.g., patient had IV + blood draw same day)
-- All notes created in a multi-service encounter flow share the same visit_group_id

ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS visit_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_patient_notes_visit_group ON patient_notes (visit_group_id) WHERE visit_group_id IS NOT NULL;
