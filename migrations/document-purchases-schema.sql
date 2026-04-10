-- Document purchases table schema
-- This table predates the migration system. This file documents the full schema
-- as it exists in production for version control and reproducibility.
-- DO NOT run this on production — the table already exists.
-- Use this as reference for new environments or schema validation.

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  patient_email TEXT,
  patient_phone TEXT,
  ghl_contact_id TEXT,

  -- Product/service info
  item_name TEXT,
  product_name TEXT,
  description TEXT,
  category TEXT,
  medication TEXT,
  quantity INTEGER DEFAULT 1,

  -- Financial
  amount NUMERIC,            -- catalog/list price (dollars)
  amount_paid NUMERIC,       -- actual amount charged (dollars) — USE THIS for patient-facing display
  original_amount NUMERIC,   -- pre-discount price (dollars) — internal only, never show to patients
  shipping NUMERIC DEFAULT 0,
  discount_type TEXT,
  discount_amount NUMERIC,
  list_price NUMERIC,        -- catalog price from sync

  -- Stripe payment fields
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  stripe_amount_cents INTEGER,
  stripe_status TEXT,         -- succeeded, failed, refunded, partially_refunded
  stripe_verified_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'manual',  -- stripe, ghl, manual, cash
  card_brand TEXT,
  card_last4 TEXT,

  -- Protocol/service linking
  protocol_id UUID,
  protocol_created BOOLEAN DEFAULT false,
  session_logged BOOLEAN DEFAULT false,

  -- Status/pipeline
  dismissed BOOLEAN DEFAULT false,
  status TEXT,
  source TEXT,               -- stripe_pos, payment_link, ghl, website_checkout, calendar

  -- Dates
  purchase_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes (some added via earlier migrations)
CREATE INDEX IF NOT EXISTS idx_purchases_patient_id ON purchases(patient_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment_intent_id ON purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
