-- Start Leads table for /start funnel
-- Tracks all inquiries through the "Start Here" funnel

CREATE TABLE start_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  path TEXT NOT NULL, -- 'injury', 'energy', 'labs'
  main_concern TEXT,
  urgency INTEGER, -- 1-10 scale
  has_recent_labs BOOLEAN DEFAULT false,
  lab_file_url TEXT,
  consent_sms BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'new', -- new, texted, booked, showed, started
  booked_at TIMESTAMPTZ,
  nudge_24h_sent BOOLEAN DEFAULT false,
  nudge_72h_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_start_leads_status ON start_leads(status);
CREATE INDEX idx_start_leads_path ON start_leads(path);
CREATE INDEX idx_start_leads_created_at ON start_leads(created_at);

-- Enable RLS
ALTER TABLE start_leads ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON start_leads
  FOR ALL USING (auth.role() = 'service_role');

-- Create storage bucket for lab uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('start-lab-uploads', 'start-lab-uploads', false)
ON CONFLICT (id) DO NOTHING;
