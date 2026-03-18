-- Peptide POS Restructure Migration
-- Range Medical — 2026-03-18
--
-- Restructures all peptide therapy POS items into clean categories:
--   1. Recovery Peptides (10/20/30 day) — BPC-157/TB-4, 4X Blend, KLOW, GLOW
--   2. 90-Day Protocols — Monthly payment items
--   3. 90-Day Protocols — Pay Upfront (20% off) items
--   4. MOTS-C (20/30 day flat rate)
--   5. As-Needed (DSIP)
--
-- Stripe rule: All names are generic "Peptide Therapy — ..." with NO specific
-- peptide names. Specific peptide stored in peptide_identifier (internal only).

-- ── Step 1: Replace name-only unique index with composite ───────────────────
-- Allows multiple items with same name but different peptide_identifiers
DROP INDEX IF EXISTS pos_services_name_unique;
CREATE UNIQUE INDEX IF NOT EXISTS pos_services_name_peptide_unique
  ON pos_services(name, COALESCE(peptide_identifier, ''));

-- ── Step 2: Deactivate ALL existing peptide + sleep items ───────────────────
UPDATE pos_services SET active = false WHERE category = 'peptide';
UPDATE pos_services SET active = false WHERE category = 'sleep';

-- ── Step 3: Recovery Peptides ───────────────────────────────────────────────
-- All 4 peptides × 3 durations = 12 items, same pricing

-- BPC-157 / TB-4
INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — Recovery 10 Day', 'peptide', 25000, false, 'BPC-157 / TB-4', 'Recovery Peptides', 'Recovery peptide blend. 10-day protocol.', 101, true),
  ('Peptide Therapy — Recovery 20 Day', 'peptide', 45000, false, 'BPC-157 / TB-4', 'Recovery Peptides', 'Recovery peptide blend. 20-day protocol.', 102, true),
  ('Peptide Therapy — Recovery 30 Day', 'peptide', 67500, false, 'BPC-157 / TB-4', 'Recovery Peptides', 'Recovery peptide blend. 30-day protocol.', 103, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, sub_category = EXCLUDED.sub_category,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;

-- 4X Recovery Blend (BPC / TB-4 / KPV / MGF)
INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — Recovery 10 Day', 'peptide', 25000, false, '4X Recovery Blend', 'Recovery Peptides', 'Enhanced recovery blend. 10-day protocol.', 104, true),
  ('Peptide Therapy — Recovery 20 Day', 'peptide', 45000, false, '4X Recovery Blend', 'Recovery Peptides', 'Enhanced recovery blend. 20-day protocol.', 105, true),
  ('Peptide Therapy — Recovery 30 Day', 'peptide', 67500, false, '4X Recovery Blend', 'Recovery Peptides', 'Enhanced recovery blend. 30-day protocol.', 106, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, sub_category = EXCLUDED.sub_category,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;

-- KLOW
INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — Recovery 10 Day', 'peptide', 25000, false, 'KLOW', 'Recovery Peptides', 'Recovery peptide blend. 10-day protocol.', 107, true),
  ('Peptide Therapy — Recovery 20 Day', 'peptide', 45000, false, 'KLOW', 'Recovery Peptides', 'Recovery peptide blend. 20-day protocol.', 108, true),
  ('Peptide Therapy — Recovery 30 Day', 'peptide', 67500, false, 'KLOW', 'Recovery Peptides', 'Recovery peptide blend. 30-day protocol.', 109, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, sub_category = EXCLUDED.sub_category,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;

-- GLOW
INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — Recovery 10 Day', 'peptide', 25000, false, 'GLOW', 'Recovery Peptides', 'Recovery peptide blend. 10-day protocol.', 110, true),
  ('Peptide Therapy — Recovery 20 Day', 'peptide', 45000, false, 'GLOW', 'Recovery Peptides', 'Recovery peptide blend. 20-day protocol.', 111, true),
  ('Peptide Therapy — Recovery 30 Day', 'peptide', 67500, false, 'GLOW', 'Recovery Peptides', 'Recovery peptide blend. 30-day protocol.', 112, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, sub_category = EXCLUDED.sub_category,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;

-- ── Step 4: 90-Day Protocols — Monthly ──────────────────────────────────────
-- Staff charges this item once per month × 3 months

INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — Monthly', 'peptide', 40000, false, '2X Blend — CJC/IPA', '90-Day Protocols — Monthly', '90-day protocol. Monthly payment (1 of 3).', 201, true),
  ('Peptide Therapy — Monthly', 'peptide', 40000, false, '2X Blend — Tesa/IPA', '90-Day Protocols — Monthly', '90-day protocol. Monthly payment (1 of 3).', 202, true),
  ('Peptide Therapy — Monthly', 'peptide', 42500, false, '3X Blend', '90-Day Protocols — Monthly', '90-day protocol. Monthly payment (1 of 3).', 203, true),
  ('Peptide Therapy — Monthly', 'peptide', 45000, false, '4X Blend', '90-Day Protocols — Monthly', '90-day protocol. Monthly payment (1 of 3).', 204, true),
  ('Peptide Therapy — Monthly', 'peptide', 20000, false, 'BDNF', '90-Day Protocols — Monthly', '90-day protocol. Monthly payment (1 of 3).', 205, true),
  ('Peptide Therapy — Monthly', 'peptide', 40000, false, 'GHK-Cu', '90-Day Protocols — Monthly', '90-day protocol. Monthly payment (1 of 3).', 206, true),
  ('Peptide Therapy — Monthly', 'peptide', 40000, false, 'AOD-9604', '90-Day Protocols — Monthly', '90-day protocol. Monthly payment (1 of 3).', 207, true),
  ('Peptide Therapy — Monthly', 'peptide', 60000, false, 'NAD+ 100mg', '90-Day Protocols — Monthly', '90-day protocol. Monthly payment (1 of 3).', 208, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, sub_category = EXCLUDED.sub_category,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;

-- ── Step 5: 90-Day Protocols — Pay Upfront (20% Off) ────────────────────────
-- Single charge for full 90-day protocol

INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — 90 Day Program', 'peptide',  96000, false, '2X Blend — CJC/IPA', '90-Day Protocols — Pay Upfront (20% Off)', '90-day protocol paid upfront. Save 20%.', 301, true),
  ('Peptide Therapy — 90 Day Program', 'peptide',  96000, false, '2X Blend — Tesa/IPA', '90-Day Protocols — Pay Upfront (20% Off)', '90-day protocol paid upfront. Save 20%.', 302, true),
  ('Peptide Therapy — 90 Day Program', 'peptide', 102000, false, '3X Blend', '90-Day Protocols — Pay Upfront (20% Off)', '90-day protocol paid upfront. Save 20%.', 303, true),
  ('Peptide Therapy — 90 Day Program', 'peptide', 108000, false, '4X Blend', '90-Day Protocols — Pay Upfront (20% Off)', '90-day protocol paid upfront. Save 20%.', 304, true),
  ('Peptide Therapy — 90 Day Program', 'peptide',  48000, false, 'BDNF', '90-Day Protocols — Pay Upfront (20% Off)', '90-day protocol paid upfront. Save 20%.', 305, true),
  ('Peptide Therapy — 90 Day Program', 'peptide',  96000, false, 'GHK-Cu', '90-Day Protocols — Pay Upfront (20% Off)', '90-day protocol paid upfront. Save 20%.', 306, true),
  ('Peptide Therapy — 90 Day Program', 'peptide',  96000, false, 'AOD-9604', '90-Day Protocols — Pay Upfront (20% Off)', '90-day protocol paid upfront. Save 20%.', 307, true),
  ('Peptide Therapy — 90 Day Program', 'peptide', 150000, false, 'NAD+ 100mg', '90-Day Protocols — Pay Upfront (20% Off)', '90-day protocol paid upfront. Save 20%.', 308, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, sub_category = EXCLUDED.sub_category,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;

-- ── Step 6: MOTS-C ─────────────────────────────────────────────────────────
-- Flat rate — same price for 20 and 30 day, different injection schedule

INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — 20 Day Protocol', 'peptide', 40000, false, 'MOTS-C (4x 5mg)', 'MOTS-C', '20-day protocol. 4 injections of 5mg.', 401, true),
  ('Peptide Therapy — 30 Day Protocol', 'peptide', 40000, false, 'MOTS-C (20x 1mg)', 'MOTS-C', '30-day protocol. 20 injections of 1mg (5 on / 2 off).', 402, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, sub_category = EXCLUDED.sub_category,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;

-- ── Step 7: DSIP (As-Needed) ────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — As Needed', 'peptide', 20000, false, 'DSIP', 'As Needed', 'As-needed sleep peptide. Monthly supply.', 501, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, sub_category = EXCLUDED.sub_category,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;

-- ── Step 8: Keep GHK-Cu Cream active ────────────────────────────────────────
-- This was deactivated in Step 2 but should stay
UPDATE pos_services SET active = true, sub_category = 'Topical' WHERE name = 'GHK-Cu Cream' AND category = 'peptide';
