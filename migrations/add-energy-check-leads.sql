-- Energy Check Leads table for /energy-check quiz funnel
-- Tracks leads through the "Energy & Recovery Check" lead magnet

CREATE TABLE energy_check_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  primary_concern TEXT NOT NULL, -- 'energy', 'recovery', 'both'
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  severity TEXT, -- 'green', 'yellow', 'red'
  door TEXT, -- 'energy', 'recovery', 'both'
  status TEXT DEFAULT 'new', -- new, results_viewed, booked
  booked_at TIMESTAMPTZ,
  nurture_step INTEGER DEFAULT 0,
  last_nurture_at TIMESTAMPTZ,
  consent_sms BOOLEAN DEFAULT false,
  source TEXT, -- 'ig', 'qr', 'direct'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_energy_check_leads_status ON energy_check_leads(status);
CREATE INDEX idx_energy_check_leads_severity ON energy_check_leads(severity);
CREATE INDEX idx_energy_check_leads_created_at ON energy_check_leads(created_at);

-- Enable RLS
ALTER TABLE energy_check_leads ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON energy_check_leads
  FOR ALL USING (auth.role() = 'service_role');
