-- Migration: Add HRT dose tracking fields to protocols table
-- Run this in Supabase SQL Editor
-- Range Medical - 2026-01-29

-- Add dose_per_injection field (stores the ml per injection, e.g., 0.4 for 0.4ml)
ALTER TABLE protocols
ADD COLUMN IF NOT EXISTS dose_per_injection DECIMAL(4,2);

-- Add injections_per_week field (typically 1 or 2 for HRT)
ALTER TABLE protocols
ADD COLUMN IF NOT EXISTS injections_per_week INTEGER DEFAULT 2;

-- Add vial_size field for vial-based protocols (in ml, e.g., 10 for 10ml vial)
ALTER TABLE protocols
ADD COLUMN IF NOT EXISTS vial_size DECIMAL(4,1);

-- Comment explaining the fields
COMMENT ON COLUMN protocols.dose_per_injection IS 'Volume per injection in ml (e.g., 0.4 for 0.4ml/80mg)';
COMMENT ON COLUMN protocols.injections_per_week IS 'Number of injections per week (typically 1 or 2)';
COMMENT ON COLUMN protocols.vial_size IS 'Vial size in ml for vial-based supply (e.g., 10 for 10ml)';

-- Update existing HRT vial protocols to have default vial_size of 10ml
UPDATE protocols
SET vial_size = 10
WHERE (supply_type ILIKE '%vial%' OR selected_dose ILIKE '%vial%')
  AND vial_size IS NULL
  AND (program_type ILIKE '%hrt%' OR program_type ILIKE '%testosterone%');
