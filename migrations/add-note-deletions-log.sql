-- Note deletions audit log
-- Tracks every note deletion with full context for accountability

CREATE TABLE IF NOT EXISTS note_deletions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL,
  patient_id UUID,
  deleted_by TEXT NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  note_body TEXT,
  note_source TEXT,
  note_status TEXT,
  note_category TEXT,
  note_created_by TEXT,
  note_created_at TIMESTAMPTZ,
  note_date TIMESTAMPTZ,
  encounter_service TEXT,
  protocol_name TEXT,
  reason TEXT
);

-- Index for looking up deletions by patient
CREATE INDEX idx_note_deletions_patient ON note_deletions(patient_id);

-- Index for looking up deletions by who deleted
CREATE INDEX idx_note_deletions_deleted_by ON note_deletions(deleted_by);
