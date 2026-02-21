-- Migration: Add last_payment_date to protocols table
-- Run this in Supabase SQL Editor
-- Range Medical - 2026-02-20
-- Separates payment tracking (from Leads) from medication refill tracking (from Service Log)

ALTER TABLE protocols
ADD COLUMN IF NOT EXISTS last_payment_date DATE;

COMMENT ON COLUMN protocols.last_payment_date IS 'Date of most recent monthly payment (set via Leads → Add to Protocol)';
