-- Add expires_at column to patient_credits for time-limited credits
-- Used for assessment credits ($197) that expire 7 days after completion

ALTER TABLE patient_credits
ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL;

-- Add source column to track where the credit came from
ALTER TABLE patient_credits
ADD COLUMN IF NOT EXISTS source text DEFAULT NULL;

COMMENT ON COLUMN patient_credits.expires_at IS 'When this credit expires. NULL = never expires.';
COMMENT ON COLUMN patient_credits.source IS 'Source of credit: assessment, manual, refund, etc.';
