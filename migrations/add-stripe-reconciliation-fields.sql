-- Add Stripe reconciliation fields to purchases table
-- These store the actual amount Stripe charged (source of truth) and verification metadata

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stripe_amount_cents INTEGER;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stripe_verified_at TIMESTAMPTZ;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stripe_status TEXT;

COMMENT ON COLUMN purchases.stripe_amount_cents IS 'Actual amount charged by Stripe (in cents) — source of truth for what was billed';
COMMENT ON COLUMN purchases.stripe_verified_at IS 'Timestamp of last Stripe verification';
COMMENT ON COLUMN purchases.stripe_status IS 'Payment status from Stripe: succeeded, failed, pending, refunded';
