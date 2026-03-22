-- Add AI synopsis columns to labs table
-- Stores AI-generated clinical analysis for provider review

ALTER TABLE labs ADD COLUMN IF NOT EXISTS ai_synopsis TEXT;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS ai_synopsis_generated_at TIMESTAMPTZ;
