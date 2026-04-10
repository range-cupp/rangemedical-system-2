-- Add id_on_file to patients table
-- Once staff verifies a patient's ID, it persists across all future appointments
ALTER TABLE patients ADD COLUMN IF NOT EXISTS id_on_file BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN patients.id_on_file IS 'Patient ID has been verified and is on file — persists across appointments';
