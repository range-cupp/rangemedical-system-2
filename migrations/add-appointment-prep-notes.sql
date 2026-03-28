-- Add prep_notes column to appointments table
-- Staff-facing free-text prep notes for appointment preparation

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS prep_notes TEXT;
COMMENT ON COLUMN appointments.prep_notes IS 'Free-text prep notes added by staff';
