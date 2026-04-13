-- Add UTM tracking columns to assessment_leads table
-- Run this migration in Supabase SQL editor

ALTER TABLE assessment_leads
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- Index on utm_source + utm_content for quick filtering by source
CREATE INDEX IF NOT EXISTS idx_assessment_leads_utm_source ON assessment_leads (utm_source);
CREATE INDEX IF NOT EXISTS idx_assessment_leads_utm_content ON assessment_leads (utm_content);
