CREATE TABLE quiz_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  path TEXT NOT NULL,
  answers JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new',
  nurture_step INT DEFAULT 1,
  converted_at TIMESTAMPTZ,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quiz_leads_status ON quiz_leads(status);
CREATE INDEX idx_quiz_leads_email ON quiz_leads(email);
CREATE INDEX idx_quiz_leads_nurture ON quiz_leads(nurture_step);
CREATE INDEX idx_quiz_leads_created ON quiz_leads(created_at);

ALTER TABLE quiz_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON quiz_leads
  FOR ALL USING (auth.role() = 'service_role');
