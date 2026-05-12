-- Add plan_summary JSONB column to patient_notes
-- Stores AI-generated structured summaries of provider consultation notes.
-- Generated on note creation for provider consult/lab-review encounters,
-- emailed to Chris, and displayed in the patient profile Plan Summaries tab.

ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS plan_summary jsonb;

-- Index for fast lookup of notes with summaries per patient
CREATE INDEX IF NOT EXISTS idx_patient_notes_plan_summary
  ON patient_notes (patient_id)
  WHERE plan_summary IS NOT NULL;
