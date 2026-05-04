-- Link service_logs to their originating encounter note so notes can re-sync
-- their service_log on edit, and so the same appointment doesn't create
-- duplicate injection rows when an encounter note is edited or re-saved.
ALTER TABLE service_logs
  ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES patient_notes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_service_logs_note_id ON service_logs(note_id);
