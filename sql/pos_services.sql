-- POS Services Table + Discount Columns
-- Run this in Supabase SQL Editor

-- Enable uuid extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- POS Services catalog table
CREATE TABLE IF NOT EXISTS pos_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,          -- cents
  recurring BOOLEAN DEFAULT false,
  interval TEXT,                    -- 'month' | null
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data (matches existing pos-pricing.js catalog, HRT corrected to $250)

-- Lab Panels
INSERT INTO pos_services (name, category, price, recurring, sort_order) VALUES
  ('Men''s Essential Panel', 'lab_panels', 35000, false, 1),
  ('Men''s Elite Panel', 'lab_panels', 75000, false, 2),
  ('Women''s Essential Panel', 'lab_panels', 35000, false, 3),
  ('Women''s Elite Panel', 'lab_panels', 75000, false, 4);

-- IV Therapy
INSERT INTO pos_services (name, category, price, recurring, sort_order) VALUES
  ('NAD+ 500mg', 'iv_therapy', 65000, false, 1),
  ('NAD+ 250mg', 'iv_therapy', 45000, false, 2),
  ('Myers Cocktail', 'iv_therapy', 27500, false, 3),
  ('Recovery IV', 'iv_therapy', 27500, false, 4),
  ('Immunity IV', 'iv_therapy', 27500, false, 5),
  ('Performance IV', 'iv_therapy', 27500, false, 6),
  ('Inner Beauty IV', 'iv_therapy', 27500, false, 7),
  ('B12 Shot', 'iv_therapy', 3500, false, 8);

-- Regenerative
INSERT INTO pos_services (name, category, price, recurring, sort_order) VALUES
  ('HBOT Session', 'regenerative', 15000, false, 1),
  ('HBOT 10-Pack', 'regenerative', 120000, false, 2),
  ('Red Light Therapy', 'regenerative', 7500, false, 3),
  ('RLT 10-Pack', 'regenerative', 60000, false, 4);

-- Weight Loss (Monthly)
INSERT INTO pos_services (name, category, price, recurring, interval, sort_order) VALUES
  ('Semaglutide', 'weight_loss', 35000, true, 'month', 1),
  ('Tirzepatide', 'weight_loss', 45000, true, 'month', 2);

-- HRT (Monthly) — corrected to $250
INSERT INTO pos_services (name, category, price, recurring, interval, sort_order) VALUES
  ('Testosterone Cypionate', 'hrt', 25000, true, 'month', 1);

-- Add discount tracking columns to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS discount_type TEXT;       -- 'percent' | 'dollar' | null
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS discount_amount NUMERIC;  -- the discount value (percent or dollar amount)
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS original_amount NUMERIC;  -- price before discount (in dollars)
