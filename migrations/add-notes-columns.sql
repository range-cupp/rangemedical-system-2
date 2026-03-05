-- Add columns to patient_notes for staff-entered clinical notes
-- Run in Supabase SQL Editor

-- Add raw_input column to preserve original dictated/typed text before AI formatting
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS raw_input TEXT;

-- Add created_by column for staff name tracking
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Drop the UNIQUE constraint on ghl_note_id so manually created notes can have NULL
-- (PostgreSQL convention: tablename_columnname_key)
ALTER TABLE patient_notes DROP CONSTRAINT IF EXISTS patient_notes_ghl_note_id_key;

-- Re-create as a partial unique index that only enforces uniqueness on non-NULL values
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_notes_ghl_note_id_unique
  ON patient_notes(ghl_note_id) WHERE ghl_note_id IS NOT NULL;

-- Drop the old non-unique index if it exists (from backup-ghl-notes.sql)
DROP INDEX IF EXISTS idx_patient_notes_ghl_note_id;
