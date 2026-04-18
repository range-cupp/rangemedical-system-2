-- Allow admins to mark a patient's medical intake as already completed via an
-- external/legacy form (paper, old EMR, verbal) without requiring a full
-- new-system submission. A synthetic row is inserted into `intakes` with these
-- fields populated so existing forms_complete logic treats the patient as done.
ALTER TABLE intakes ADD COLUMN IF NOT EXISTS external_source text;
ALTER TABLE intakes ADD COLUMN IF NOT EXISTS external_notes text;
ALTER TABLE intakes ADD COLUMN IF NOT EXISTS marked_external_by text;

CREATE INDEX IF NOT EXISTS idx_intakes_external_source
  ON intakes(external_source)
  WHERE external_source IS NOT NULL;
