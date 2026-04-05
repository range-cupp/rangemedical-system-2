-- Shared protocol plans for patient-facing view
CREATE TABLE IF NOT EXISTS shared_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  plan_data JSONB NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_shared_plans_token ON shared_plans(token);
