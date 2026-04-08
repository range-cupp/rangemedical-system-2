-- NAD+ Injection Packs + Category Migration
-- Range Medical — 2026-03-31
--
-- 1. Recategorizes individual NAD+ injections from 'injections' to 'nad_injection'
-- 2. Adds NAD+ 12-for-10 pack products for all dosages
-- Run in Supabase SQL editor

-- ── Recategorize individual NAD+ injections ─────────────────────────────────

UPDATE pos_services
SET category = 'nad_injection'
WHERE name LIKE 'NAD+ Injection%' AND category = 'injections';

-- ── Add NAD+ 12-Pack products (buy 12, pay for 10) ─────────────────────────

-- Add unique index if not exists (should already be there from full-service-catalog)
CREATE UNIQUE INDEX IF NOT EXISTS pos_services_name_unique ON pos_services(name);

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('NAD+ 50mg — 12-Pack (Pay for 10)',  'nad_injection', 25000, false, '12 NAD+ 50mg IM injections for the price of 10. MWF schedule, ~4 weeks.', 10),
  ('NAD+ 75mg — 12-Pack (Pay for 10)',  'nad_injection', 37500, false, '12 NAD+ 75mg IM injections for the price of 10. MWF schedule, ~4 weeks.', 11),
  ('NAD+ 100mg — 12-Pack (Pay for 10)', 'nad_injection', 50000, false, '12 NAD+ 100mg IM injections for the price of 10. MWF schedule, ~4 weeks.', 12),
  ('NAD+ 125mg — 12-Pack (Pay for 10)', 'nad_injection', 62500, false, '12 NAD+ 125mg IM injections for the price of 10. MWF schedule, ~4 weeks.', 13),
  ('NAD+ 150mg — 12-Pack (Pay for 10)', 'nad_injection', 75000, false, '12 NAD+ 150mg IM injections for the price of 10. MWF schedule, ~4 weeks.', 14)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, category = EXCLUDED.category, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;

-- ── Update sort order for consistent display ────────────────────────────────
-- Ensure active=true for all NAD injection items
UPDATE pos_services SET active = true WHERE category = 'nad_injection';
