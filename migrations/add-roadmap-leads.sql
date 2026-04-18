-- Roadmap Leads table for /roadmap funnel
-- Aspiration-based lead magnet: "What are you missing out on + what would success look like in 6 months?"
-- Score 7-10 → prominent Range Assessment CTA
-- Score 1-6 → nurture email sequence

CREATE TABLE roadmap_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  path TEXT NOT NULL, -- 'injury', 'energy'
  missing_out TEXT[] DEFAULT '{}', -- multi-select chips
  success_vision TEXT, -- "If we worked together for 6 months, what would make it a success for you?"
  cost_of_waiting TEXT, -- "What happens if nothing changes in the next year?"
  urgency INTEGER, -- 1-10 scale
  score_tier TEXT, -- 'assessment' (7-10) or 'nurture' (1-6)
  consent_sms BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'new', -- new, texted, emailed, booked, showed, started
  nurture_sequence_step INTEGER DEFAULT 0, -- tracks which nurture email they've received
  nurture_sequence_started_at TIMESTAMPTZ,
  booked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_roadmap_leads_status ON roadmap_leads(status);
CREATE INDEX idx_roadmap_leads_path ON roadmap_leads(path);
CREATE INDEX idx_roadmap_leads_score_tier ON roadmap_leads(score_tier);
CREATE INDEX idx_roadmap_leads_created_at ON roadmap_leads(created_at);

-- Enable RLS
ALTER TABLE roadmap_leads ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON roadmap_leads
  FOR ALL USING (auth.role() = 'service_role');
