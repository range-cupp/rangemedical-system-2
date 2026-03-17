-- IV POS Reorganization Migration
-- Range Medical — 2026-03-16
--
-- 1. Adds signature IV formulas to iv_therapy category
-- 2. Moves NAD+, Vitamin C, Glutathione, Methylene Blue to specialty_iv category
-- 3. Adds Methylene Blue IV standalone product
-- 4. Adds MB Pre-Screening Blood Panel product
-- 5. Keeps Range IV + IV Add-on + Exosome IV in iv_therapy
--
-- Run in Supabase SQL editor

-- ── Add Methylene Blue IV standalone ────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('Methylene Blue IV', 'specialty_iv', 45000, false, 'Methylene Blue IV infusion. Mitochondrial support, cognitive enhancement. Requires pre-screening blood work (G6PD, CMP, CBC).', 20)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  price_cents = EXCLUDED.price_cents,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- ── Add MB Pre-Screening Blood Panel ────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('MB Pre-Screening Panel (G6PD, CMP, CBC)', 'specialty_iv', 12500, false, 'Required pre-screening blood work for Methylene Blue and High-Dose Vitamin C IVs. Includes G6PD deficiency test, CMP, and CBC.', 25)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  price_cents = EXCLUDED.price_cents,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- ── Add Range IV Signature Formulas to iv_therapy ──────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('Range IV — Immune Defense',           'iv_therapy', 22500, false, 'Immune Defense IV: Vitamin C, Zinc, Glutathione, B-Complex, Magnesium. 60 min.', 2),
  ('Range IV — Energy & Vitality',        'iv_therapy', 22500, false, 'Energy & Vitality IV: B12, B-Complex, L-Carnitine, Magnesium, Vitamin C. 60 min.', 3),
  ('Range IV — Muscle Recovery',          'iv_therapy', 22500, false, 'Muscle Recovery IV: Amino Acids, Magnesium, B-Complex, Vitamin C, Glutathione. 60 min.', 4),
  ('Range IV — Detox & Cellular Repair',  'iv_therapy', 22500, false, 'Detox & Cellular Repair IV: Glutathione, Vitamin C, NAC, Zinc, Magnesium. 60 min.', 5)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  price_cents = EXCLUDED.price_cents,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- ── Move NAD+ IVs to specialty_iv ──────────────────────────────────────────

UPDATE pos_services SET category = 'specialty_iv', sort_order = 1 WHERE name = 'NAD+ 225mg' AND active = true;
UPDATE pos_services SET category = 'specialty_iv', sort_order = 2 WHERE name = 'NAD+ 500mg' AND active = true;
UPDATE pos_services SET category = 'specialty_iv', sort_order = 3 WHERE name = 'NAD+ 750mg' AND active = true;
UPDATE pos_services SET category = 'specialty_iv', sort_order = 4 WHERE name = 'NAD+ 1000mg' AND active = true;

-- ── Move Vitamin C IVs to specialty_iv ─────────────────────────────────────

UPDATE pos_services SET category = 'specialty_iv', sort_order = 10 WHERE name = 'Vitamin C 25g' AND active = true;
UPDATE pos_services SET category = 'specialty_iv', sort_order = 11 WHERE name = 'Vitamin C 50g' AND active = true;
UPDATE pos_services SET category = 'specialty_iv', sort_order = 12 WHERE name = 'Vitamin C 75g' AND active = true;

-- ── Move Glutathione IVs to specialty_iv ───────────────────────────────────

UPDATE pos_services SET category = 'specialty_iv', sort_order = 15 WHERE name = 'Glutathione 1g' AND active = true;
UPDATE pos_services SET category = 'specialty_iv', sort_order = 16 WHERE name = 'Glutathione 2g' AND active = true;
UPDATE pos_services SET category = 'specialty_iv', sort_order = 17 WHERE name = 'Glutathione 3g' AND active = true;

-- ── Move MB Combo to specialty_iv ──────────────────────────────────────────

UPDATE pos_services SET category = 'specialty_iv', sort_order = 21 WHERE name = 'MB + Vit C + Mag Combo' AND active = true;

-- ── Update Range IV sort_order and IV Add-on ───────────────────────────────

UPDATE pos_services SET sort_order = 1 WHERE name = 'Range IV' AND category = 'iv_therapy';
UPDATE pos_services SET sort_order = 10 WHERE name = 'IV Add-on' AND category = 'iv_therapy';
UPDATE pos_services SET sort_order = 15 WHERE name = 'Exosome IV' AND category = 'iv_therapy';

-- ── Update iv_therapy descriptions for Vitamin C to note blood work ────────

UPDATE pos_services SET description = 'High-dose Vitamin C 25g IV. Requires pre-screening blood work (G6PD, CMP, CBC). Immune support, anti-oxidant.' WHERE name = 'Vitamin C 25g';
UPDATE pos_services SET description = 'High-dose Vitamin C 50g IV. Requires pre-screening blood work (G6PD, CMP, CBC).' WHERE name = 'Vitamin C 50g';
UPDATE pos_services SET description = 'High-dose Vitamin C 75g IV. Requires pre-screening blood work (G6PD, CMP, CBC).' WHERE name = 'Vitamin C 75g';
