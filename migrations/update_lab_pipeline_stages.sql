-- Migration: Update Lab Pipeline Stages
-- Replaces 5-stage pipeline with 6 new clinical stages
-- Run this in Supabase SQL Editor
-- Date: 2026-02-10

-- =========================
-- 1. ADD NEW COLUMNS
-- =========================

ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS provider_reviewed_date DATE;
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS consultation_scheduled_date TIMESTAMPTZ;
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS follow_up_flagged_date DATE;
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS treatment_started_date DATE;

-- Also add missing columns used by the webhook
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS patient_phone TEXT;
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS patient_email TEXT;
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS blood_draw_appointment_id TEXT;
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS blood_draw_calendar_id TEXT;
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS lab_review_appointment_id TEXT;
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS lab_review_scheduled_date TIMESTAMPTZ;
ALTER TABLE lab_journeys ADD COLUMN IF NOT EXISTS lab_review_completed_date TIMESTAMPTZ;

-- =========================
-- 2. MIGRATE EXISTING STAGE VALUES
-- =========================

-- scheduled → draw_scheduled (same concept, just renamed)
UPDATE lab_journeys SET stage = 'draw_scheduled' WHERE stage = 'scheduled' AND journey_type = 'new_patient';

-- outreach_due → draw_complete (blood was drawn, now waiting for provider review)
UPDATE lab_journeys SET stage = 'draw_complete' WHERE stage = 'outreach_due' AND journey_type = 'new_patient';

-- outreach_complete → provider_reviewed (contacted = provider has reviewed)
UPDATE lab_journeys
SET stage = 'provider_reviewed',
    provider_reviewed_date = outreach_completed_date
WHERE stage = 'outreach_complete' AND journey_type = 'new_patient';

-- review_scheduled → consult_scheduled
UPDATE lab_journeys
SET stage = 'consult_scheduled',
    consultation_scheduled_date = lab_review_scheduled_date
WHERE stage = 'review_scheduled' AND journey_type = 'new_patient';

-- review_complete → treatment_started
UPDATE lab_journeys
SET stage = 'treatment_started',
    treatment_started_date = COALESCE(lab_review_completed_date::date, CURRENT_DATE)
WHERE stage = 'review_complete' AND journey_type = 'new_patient';

-- Note: Old columns (outreach_due_date, outreach_completed_date, outreach_method, outreach_notes)
-- are kept for historical data. They are not dropped.
