-- Add medical intake fields to assessment_leads table
-- Run this migration in Supabase SQL editor

ALTER TABLE assessment_leads
  ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS medical_history JSONB,
  ADD COLUMN IF NOT EXISTS medications JSONB,
  ADD COLUMN IF NOT EXISTS allergies JSONB,
  ADD COLUMN IF NOT EXISTS surgical_history JSONB,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
  ADD COLUMN IF NOT EXISTS current_medications_text TEXT,
  ADD COLUMN IF NOT EXISTS known_allergies_text TEXT,
  ADD COLUMN IF NOT EXISTS no_known_allergies BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS diagnosed_conditions_text TEXT,
  ADD COLUMN IF NOT EXISTS recommended_panel TEXT,
  ADD COLUMN IF NOT EXISTS recommended_peptides JSONB,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS consolidated_email_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS intake_status TEXT DEFAULT 'pending';

-- Also create storage bucket for assessment PDFs (run in Supabase dashboard or via API):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assessment-pdfs', 'assessment-pdfs', false);
