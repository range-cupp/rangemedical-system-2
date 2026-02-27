-- Add hrt_followup_date column to protocols table
-- For tracking 8-week follow-up appointments for HRT protocols
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS hrt_followup_date DATE;

-- Also add hrt_type column if not already present
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS hrt_type TEXT;
