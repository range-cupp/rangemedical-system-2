-- Sales Pipeline table
-- Unified lead tracking from first contact through conversion
-- Sits BEFORE the labs pipeline in the patient journey

CREATE TABLE IF NOT EXISTS sales_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL DEFAULT 'manual',        -- assessment, energy_check, start, manual, referral
  lead_id UUID,                                     -- reference to source lead table (nullable for manual)
  patient_id UUID REFERENCES patients(id),          -- linked when converted to patient
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,                                      -- website, referral, walk_in, instagram, assessment, energy_check, google
  path TEXT,                                        -- injury, energy, labs (from assessment/start flows)
  stage TEXT NOT NULL DEFAULT 'new_lead',            -- new_lead, contacted, follow_up, booked, showed, started, lost
  assigned_to TEXT,                                  -- staff member name
  notes TEXT,
  lost_reason TEXT,
  urgency INTEGER,                                  -- 1-10 scale
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_pipeline_stage ON sales_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_sales_pipeline_lead ON sales_pipeline(lead_type, lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_pipeline_phone ON sales_pipeline(phone);
CREATE INDEX IF NOT EXISTS idx_sales_pipeline_created ON sales_pipeline(created_at DESC);

ALTER TABLE sales_pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON sales_pipeline FOR ALL USING (true) WITH CHECK (true);
