-- Add first_followup_weeks column to protocols table
-- Controls HRT blood draw schedule: 8 (default) or 12 weeks for the first follow-up
-- After the first follow-up, draws are always every 12 weeks

ALTER TABLE protocols
ADD COLUMN IF NOT EXISTS first_followup_weeks integer DEFAULT 8;

COMMENT ON COLUMN protocols.first_followup_weeks IS 'HRT first follow-up interval in weeks (8 or 12). Default 8. Subsequent follow-ups are always 12 weeks.';
