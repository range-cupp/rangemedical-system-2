-- Gift Cards system — Range Medical
-- Run this in Supabase SQL Editor

-- Gift Cards table
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  initial_amount INTEGER NOT NULL,        -- cents
  remaining_amount INTEGER NOT NULL,      -- cents
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'depleted' | 'voided'
  buyer_patient_id UUID REFERENCES patients(id),
  buyer_name TEXT,
  purchase_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_buyer ON gift_cards(buyer_patient_id);

-- Gift Card Redemptions ledger
CREATE TABLE IF NOT EXISTS gift_card_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id),
  purchase_id UUID,
  amount INTEGER NOT NULL,                -- cents redeemed
  redeemed_by_patient_id UUID REFERENCES patients(id),
  redeemed_by_name TEXT,
  balance_before INTEGER NOT NULL,        -- cents before redemption
  balance_after INTEGER NOT NULL,         -- cents after redemption
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_redemptions_card ON gift_card_redemptions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gc_redemptions_purchase ON gift_card_redemptions(purchase_id);

-- Updated_at trigger for gift_cards
CREATE OR REPLACE FUNCTION update_gift_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gift_cards_updated_at ON gift_cards;
CREATE TRIGGER trigger_gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_cards_updated_at();

-- Seed POS services for gift card presets
INSERT INTO pos_services (name, category, price, recurring, sort_order) VALUES
  ('Gift Card — $100', 'gift_card', 10000, false, 1),
  ('Gift Card — $250', 'gift_card', 25000, false, 2),
  ('Gift Card — $500', 'gift_card', 50000, false, 3),
  ('Gift Card — $1,000', 'gift_card', 100000, false, 4)
ON CONFLICT DO NOTHING;
