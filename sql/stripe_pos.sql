-- Stripe POS Migration
-- Run this in Supabase SQL Editor

-- Add stripe_customer_id to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
CREATE INDEX IF NOT EXISTS idx_patients_stripe_customer_id ON patients(stripe_customer_id);

-- Add Stripe fields to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual';
-- payment_method values: 'stripe', 'ghl', 'manual', 'cash'
