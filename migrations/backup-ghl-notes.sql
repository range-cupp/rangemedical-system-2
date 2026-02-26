-- Create patient_notes table for GHL backup
-- Run in Supabase SQL Editor before running scripts/backup-ghl.js

CREATE TABLE IF NOT EXISTS patient_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  ghl_note_id TEXT UNIQUE,
  body TEXT NOT NULL,
  note_date TIMESTAMPTZ,
  source TEXT DEFAULT 'ghl_backup',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_ghl_note_id ON patient_notes(ghl_note_id);
