-- Add preferred_name column to patients and intakes tables
-- Run in Supabase SQL Editor

ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE intakes ADD COLUMN IF NOT EXISTS preferred_name TEXT;
