-- Add AI synopsis fields to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ai_synopsis TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ai_synopsis_generated_at TIMESTAMPTZ;
