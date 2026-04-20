-- Giveaway Entries table for /giveaway campaign
-- Captures applications for the "6-Week Cellular Energy Reset" giveaway
-- Winner gets the full program free; non-winners get offered a $1,000 scholarship ($2,999 → $1,999)

CREATE TABLE IF NOT EXISTS giveaway_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Contact
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  instagram_handle TEXT,
  consent_marketing BOOLEAN NOT NULL DEFAULT false,

  -- Story / qualification
  struggle_main TEXT NOT NULL,       -- 'energy', 'brain_fog', 'recovery', 'weight_loss', 'other'
  struggle_other TEXT,
  bad_day_description TEXT NOT NULL,
  desired_change TEXT NOT NULL,
  importance_90d INTEGER NOT NULL,   -- 1-10
  budget_answer TEXT NOT NULL,       -- 'yes', 'yes_with_payments', 'no'

  -- Lead scoring
  lead_score INTEGER DEFAULT 0,
  lead_tier TEXT,                    -- 'green', 'yellow', 'red'

  -- Campaign state
  is_winner BOOLEAN NOT NULL DEFAULT false,
  scholarship_offered_at TIMESTAMPTZ,
  scholarship_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new',  -- new, winner_notified, scholarship_offered, scholarship_interested, scheduled, lost

  -- Audit
  campaign_key TEXT DEFAULT 'cellular_reset_2026_04',  -- groups entries into a batch so we can run multiple campaigns
  source TEXT,                        -- 'ig', 'qr', 'direct'
  patient_id UUID REFERENCES patients(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_giveaway_entries_status ON giveaway_entries(status);
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_tier ON giveaway_entries(lead_tier);
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_created_at ON giveaway_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_campaign ON giveaway_entries(campaign_key);
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_phone ON giveaway_entries(phone);

ALTER TABLE giveaway_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON giveaway_entries
  FOR ALL USING (auth.role() = 'service_role');
