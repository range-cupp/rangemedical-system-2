-- Mother's Day Wellness Credit Promo 2026
-- Extends the existing gift_cards system with promo-specific metadata
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mothers_day_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id),
  purchaser_name TEXT NOT NULL,
  purchaser_email TEXT NOT NULL,
  purchaser_phone TEXT,
  is_gift BOOLEAN NOT NULL DEFAULT false,
  recipient_name TEXT,
  recipient_email TEXT,
  amount_paid INTEGER NOT NULL DEFAULT 30000,     -- cents ($300)
  credit_value INTEGER NOT NULL DEFAULT 40000,    -- cents ($400)
  send_type TEXT NOT NULL DEFAULT 'now',           -- 'now' | 'scheduled'
  scheduled_send_at TIMESTAMPTZ,
  gift_sent BOOLEAN NOT NULL DEFAULT false,
  gift_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mdp_gift_card ON mothers_day_promos(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_mdp_pending ON mothers_day_promos(gift_sent, scheduled_send_at)
  WHERE gift_sent = false AND send_type = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_mdp_purchaser ON mothers_day_promos(purchaser_email);
