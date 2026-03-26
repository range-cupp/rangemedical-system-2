-- Trial Passes table
-- Tracks Red Light Trial ad offer: 7 days of RLT sessions for $49
-- Linked to sales_pipeline for funnel tracking
-- Range Medical

CREATE TABLE IF NOT EXISTS trial_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  patient_id UUID REFERENCES patients(id),
  sales_pipeline_id UUID REFERENCES sales_pipeline(id),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  instagram_handle TEXT,

  -- From DM qualification
  main_problem TEXT,                        -- energy, recovery, sleep, skin
  importance_1_10 INTEGER,                  -- "how important is it to fix this in 90 days?"

  -- Payment
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER DEFAULT 4900,
  payment_status TEXT DEFAULT 'pending',     -- pending, paid, refunded

  -- Trial state
  status TEXT NOT NULL DEFAULT 'pending',    -- pending, purchased, active, expiring, completed, converted, expired
  sessions_used INTEGER DEFAULT 0,

  -- Dates
  purchased_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,                  -- first session check-in
  expires_at DATE,                           -- activated_at + 7 days
  completed_at TIMESTAMPTZ,

  -- Survey tracking
  pre_survey_completed BOOLEAN DEFAULT false,
  post_survey_completed BOOLEAN DEFAULT false,

  -- Check-in / conversion
  checkin_recommendation TEXT,               -- assessment_program, membership, pack, nurture
  checkin_notes TEXT,
  converted_to TEXT,                         -- what they bought if converted
  conversion_purchase_id UUID REFERENCES purchases(id),

  -- Source tracking
  source TEXT DEFAULT 'instagram',           -- instagram, website, walk_in, manychat
  manychat_subscriber_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_passes_status ON trial_passes(status);
CREATE INDEX IF NOT EXISTS idx_trial_passes_phone ON trial_passes(phone);
CREATE INDEX IF NOT EXISTS idx_trial_passes_email ON trial_passes(email);
CREATE INDEX IF NOT EXISTS idx_trial_passes_expires ON trial_passes(expires_at);
CREATE INDEX IF NOT EXISTS idx_trial_passes_patient ON trial_passes(patient_id);
CREATE INDEX IF NOT EXISTS idx_trial_passes_pipeline ON trial_passes(sales_pipeline_id);

ALTER TABLE trial_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON trial_passes FOR ALL USING (true) WITH CHECK (true);
