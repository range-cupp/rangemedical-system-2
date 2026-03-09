-- Add injection_method and onboarding_start_date to protocols table
-- For HRT onboarding system
-- Run in Supabase SQL Editor

-- injection_method: 'im' (intramuscular) or 'subq' (subcutaneous) for take-home HRT
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS injection_method TEXT;

-- onboarding_start_date: when the HRT onboarding email/SMS sequence was triggered
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS onboarding_start_date DATE;
