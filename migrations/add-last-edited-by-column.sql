-- Track who last edited a note and when (any staff can edit any note)
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS last_edited_by TEXT;
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;
