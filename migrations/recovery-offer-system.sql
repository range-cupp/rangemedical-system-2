-- Recovery Offer System Migration
-- Range Medical — 2026-04-14
--
-- Creates the recovery offer ladder:
--   Test Drive ($149) -> Sprint ($997) -> Membership ($799/28d) -> Power Pack ($399)
-- Plus single-session fallback (HBOT $185, RLT $85)
--
-- Run in Supabase SQL editor

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE 1: recovery_offers (static reference — 5 offer definitions)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recovery_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('TEST_DRIVE', 'SPRINT', 'MEMBERSHIP', 'ADD_ON', 'SINGLE_SESSION')),
  is_membership BOOLEAN NOT NULL DEFAULT false,
  billing_cycle_days INTEGER,                    -- 28 for membership, NULL otherwise
  base_price_cents INTEGER NOT NULL,
  sessions_per_cycle INTEGER NOT NULL,           -- how many Recovery Sessions included
  rack_rate_cents INTEGER,                       -- anchor value for display
  is_public BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the 5 offers
INSERT INTO recovery_offers (name, offer_type, is_membership, billing_cycle_days, base_price_cents, sessions_per_cycle, rack_rate_cents, is_public) VALUES
  ('Recovery Session Test Drive',         'TEST_DRIVE',      false, NULL, 14900,  2,  27000,  true),
  ('14-Day Recovery & Energy Sprint',     'SPRINT',          false, NULL, 99700,  8,  216000, true),
  ('Recovery Membership',                 'MEMBERSHIP',      true,  28,   79900,  8,  216000, true),
  ('Recovery Power Pack',                 'ADD_ON',          false, NULL, 39900,  8,  NULL,   false),
  ('Single Recovery Session',             'SINGLE_SESSION',  false, NULL, 0,      1,  NULL,   true)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE 2: recovery_enrollments (per-patient enrollment tracking)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recovery_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  offer_id UUID NOT NULL REFERENCES recovery_offers(id),
  protocol_id UUID REFERENCES protocols(id),
  stripe_subscription_id TEXT,                   -- for membership recurring billing
  modality_preference TEXT NOT NULL DEFAULT 'COMBINED'
    CHECK (modality_preference IN ('COMBINED', 'RLT_ONLY', 'HBOT_ONLY')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,                                 -- Sprint: start+14d, Membership: NULL
  cycle_start DATE,                              -- current billing cycle start
  cycle_end DATE,                                -- cycle_start + 28d
  sessions_allowed INTEGER NOT NULL DEFAULT 8,
  sessions_used INTEGER NOT NULL DEFAULT 0,
  symptom_score_baseline JSONB,                  -- {pain: 0-10, recovery: 0-10, energy: 0-10}
  symptom_score_day14 JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recovery_enrollments_patient_id ON recovery_enrollments(patient_id);
CREATE INDEX IF NOT EXISTS idx_recovery_enrollments_status ON recovery_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_recovery_enrollments_offer_id ON recovery_enrollments(offer_id);

-- RLS
ALTER TABLE recovery_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_enrollments ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on recovery_offers"
  ON recovery_offers FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on recovery_enrollments"
  ON recovery_enrollments FOR ALL
  USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- POS CATALOG UPDATE: Add new recovery offer products
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO pos_services (name, category, price_cents, recurring, interval, description, sort_order) VALUES
  ('Recovery Session Test Drive',         'recovery', 14900, false, NULL,    '1 HBOT + 1 RLT session. New patients only. Value: $270.', 1),
  ('14-Day Recovery & Energy Sprint',     'recovery', 99700, false, NULL,    '8 HBOT + 8 RLT sessions over 14 days with symptom scoring. Value: $2,160.', 2),
  ('Recovery Membership',                 'recovery', 79900, true,  'month', 'Up to 8 Recovery Sessions per 28-day cycle. Priority scheduling. Sprint included as new-member bonus.', 3),
  ('Recovery Power Pack',                 'recovery', 39900, false, NULL,    '+8 extra Recovery Sessions in current cycle. Members only.', 4),
  ('Single HBOT Session',                 'recovery', 18500, false, NULL,    '60-90 min hyperbaric oxygen session.', 10),
  ('Single Red Light Session',            'recovery', 8500,  false, NULL,    '10-20 min red light therapy session.', 11)
ON CONFLICT (name) DO UPDATE SET
  price_cents = EXCLUDED.price_cents,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  recurring = EXCLUDED.recurring,
  interval = EXCLUDED.interval;

-- Deactivate old HBOT/RLT memberships and packs (replaced by unified recovery offers)
UPDATE pos_services SET active = false WHERE name IN (
  'HBOT Membership — 1x/Week',
  'HBOT Membership — 2x/Week',
  'HBOT Membership — 3x/Week',
  'HBOT + RLT Combo — 1x/Week',
  'HBOT + RLT Combo — 2x/Week',
  'HBOT + RLT Combo — 3x/Week',
  'Red Light Therapy Membership',
  'HBOT — Intro (3 Sessions)',
  'Red Light Therapy — Intro (3 Sessions)',
  'Six-Week Cellular Energy Reset',
  'Cellular Energy Maintenance (4-Week)',
  'Cellular Energy Maintenance Premium (4-Week)'
);

-- Keep single sessions and packs active as fallback
-- HBOT — Single Session, HBOT — 5-Session Pack, HBOT — 10-Session Pack
-- Red Light Therapy — Single, Red Light Therapy — 5-Pack, Red Light Therapy — 10-Pack
