-- HRT Male Questionnaire — patient-submitted responses
-- Sent via the Guides system (SMS/email) to men considering hormone replacement therapy.
-- Standalone (no token) — patient identifies themselves at the top of the form.

CREATE TABLE IF NOT EXISTS hrt_male_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hrt_male_questionnaire_phone     ON hrt_male_questionnaire_responses (phone);
CREATE INDEX IF NOT EXISTS idx_hrt_male_questionnaire_email     ON hrt_male_questionnaire_responses (email);
CREATE INDEX IF NOT EXISTS idx_hrt_male_questionnaire_patient   ON hrt_male_questionnaire_responses (patient_id);
CREATE INDEX IF NOT EXISTS idx_hrt_male_questionnaire_created   ON hrt_male_questionnaire_responses (created_at DESC);
