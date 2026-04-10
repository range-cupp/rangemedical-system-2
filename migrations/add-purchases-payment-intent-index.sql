-- Add index on stripe_payment_intent_id for webhook idempotency checks
-- Safe to run on production (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment_intent_id ON purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
