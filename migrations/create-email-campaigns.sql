-- Email Campaigns & Segments
-- Supports segmented email marketing from admin dashboard

-- Saved audience segments (reusable filters)
CREATE TABLE IF NOT EXISTS email_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  -- filters shape: { protocolTypes: ['peptide','hbot'], status: 'active', dateRange: { from, to } }
  patient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email campaigns (each send)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  segment_id UUID REFERENCES email_segments(id),
  segment_snapshot JSONB,          -- frozen copy of filters at send time
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, sending, sent, failed
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual recipient tracking per campaign
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, sent, error
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecr_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ecr_patient ON email_campaign_recipients(patient_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON email_campaigns(status);
