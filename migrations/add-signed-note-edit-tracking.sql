-- Track edits to signed notes (audit trail)
-- Allows original authors to edit their signed notes while preserving history

-- Audit log for signed note edits
CREATE TABLE IF NOT EXISTS note_edits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES patient_notes(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id),
  edited_by TEXT NOT NULL,
  previous_body TEXT,
  new_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flag on notes to indicate post-signing edits
ALTER TABLE patient_notes
  ADD COLUMN IF NOT EXISTS edited_after_signing BOOLEAN DEFAULT FALSE;
