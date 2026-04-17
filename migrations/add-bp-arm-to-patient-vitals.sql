-- Add bp_arm column to patient_vitals to track which arm BP was taken from
ALTER TABLE patient_vitals
ADD COLUMN IF NOT EXISTS bp_arm text CHECK (bp_arm IN ('left', 'right') OR bp_arm IS NULL);
