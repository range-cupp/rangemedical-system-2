-- Lab Pipeline Tables
-- Run this only if the tables don't already exist
-- These tables support the Labs Pipeline (Command Center → Labs tab)

CREATE TABLE IF NOT EXISTS lab_journeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID,
  patient_name TEXT,
  patient_phone TEXT,
  patient_email TEXT,
  ghl_contact_id TEXT,
  journey_type TEXT DEFAULT 'new_patient',  -- 'new_patient' or 'follow_up'
  stage TEXT DEFAULT 'draw_scheduled',      -- draw_scheduled, draw_complete, provider_reviewed, consult_scheduled, need_follow_up, treatment_started
  blood_draw_scheduled_date TIMESTAMPTZ,
  blood_draw_completed_date TIMESTAMPTZ,
  blood_draw_appointment_id TEXT,
  blood_draw_calendar_id TEXT,
  provider_reviewed_date DATE,
  consultation_scheduled_date TIMESTAMPTZ,
  lab_review_appointment_id TEXT,
  lab_review_scheduled_date TIMESTAMPTZ,
  lab_review_completed_date TIMESTAMPTZ,
  follow_up_flagged_date DATE,
  follow_up_notes TEXT,
  treatment_started_date DATE,
  outcome TEXT,                             -- hrt, weight_loss, peptide, thinking, declined
  outcome_notes TEXT,
  -- Legacy columns (kept for historical data)
  outreach_due_date DATE,
  outreach_completed_date DATE,
  outreach_method TEXT,
  outreach_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID,
  purchase_id UUID,
  order_type TEXT DEFAULT 'Standard',
  order_date DATE,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
