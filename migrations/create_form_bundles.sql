-- Create form_bundles table for single-link form distribution
-- Stores which forms a patient needs to complete, with a unique token URL

CREATE TABLE IF NOT EXISTS form_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES patients(id),
  ghl_contact_id TEXT,
  patient_name TEXT,
  patient_email TEXT,
  patient_phone TEXT,
  form_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_form_bundles_token ON form_bundles(token);
CREATE INDEX IF NOT EXISTS idx_form_bundles_patient_id ON form_bundles(patient_id);
