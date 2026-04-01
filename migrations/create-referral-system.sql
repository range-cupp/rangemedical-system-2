-- Referral Partner System
-- Tables: referral_partners, referral_leads

-- ============================================
-- REFERRAL PARTNERS
-- ============================================
CREATE TABLE IF NOT EXISTS referral_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  partner_type TEXT,
  assigned_to TEXT,
  headline TEXT,
  subheadline TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REFERRAL LEADS
-- ============================================
CREATE TABLE IF NOT EXISTS referral_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES referral_partners(id),
  partner_slug TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  interests TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_referral_leads_partner_slug ON referral_leads(partner_slug);
CREATE INDEX IF NOT EXISTS idx_referral_leads_status ON referral_leads(status);
CREATE INDEX IF NOT EXISTS idx_referral_leads_created_at ON referral_leads(created_at DESC);

-- ============================================
-- SEED: Greg (first referral partner)
-- ============================================
INSERT INTO referral_partners (slug, name, partner_type, assigned_to, headline, subheadline, active)
VALUES (
  'greg',
  'Greg',
  'trainer',
  'damon@range-medical.com',
  'Greg sent you here for a reason.',
  'Here''s what we actually do for people who want to perform at a higher level.',
  true
)
ON CONFLICT (slug) DO NOTHING;
