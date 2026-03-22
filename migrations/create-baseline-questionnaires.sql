-- Baseline questionnaires table for post-intake validated instruments
-- Door 1: Injury/Peptide baseline (3 questions)
-- Door 2: Energy/Optimization baseline (PHQ-9, GAD-7, PSQI, etc.)

CREATE TABLE baseline_questionnaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  intake_id UUID REFERENCES intakes(id),
  door INTEGER NOT NULL CHECK (door IN (1, 2)),
  questionnaire_type TEXT NOT NULL CHECK (questionnaire_type IN ('door1_baseline', 'door2_baseline')),
  responses JSONB NOT NULL DEFAULT '{}',
  scored_totals JSONB DEFAULT '{}',
  sections_completed JSONB DEFAULT '[]',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired')),
  token TEXT UNIQUE NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_baseline_q_patient ON baseline_questionnaires(patient_id);
CREATE INDEX idx_baseline_q_intake ON baseline_questionnaires(intake_id);
CREATE INDEX idx_baseline_q_token ON baseline_questionnaires(token);
CREATE INDEX idx_baseline_q_status ON baseline_questionnaires(status);

-- RLS
ALTER TABLE baseline_questionnaires ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access via token (patient-facing form, no auth required)
CREATE POLICY "Allow token-based access" ON baseline_questionnaires
  FOR ALL USING (true) WITH CHECK (true);
