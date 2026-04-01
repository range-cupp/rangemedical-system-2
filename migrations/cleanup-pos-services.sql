-- POS Services Cleanup Migration
-- Range Medical — 2026-03-31
--
-- Fixes: duplicate entries, category mismatches, missing items
-- Goal: Every active service lives in one correct category, no duplicates
--
-- Run in Supabase SQL editor

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. RED LIGHT THERAPY — move regenerative → red_light, deactivate dupes
-- ══════════════════════════════════════════════════════════════════════════════

-- Move the RLT Intro (only exists in regenerative)
UPDATE pos_services SET category = 'red_light', sort_order = 0
WHERE name = 'Red Light Therapy — Intro (3 Sessions)' AND category = 'regenerative' AND active = true;

-- Deactivate old regenerative items that already have red_light equivalents
UPDATE pos_services SET active = false
WHERE category = 'regenerative' AND name IN (
  'Red Light Therapy — Single',
  'Red Light Therapy — 5-Pack',
  'Red Light Therapy — 10-Pack',
  'RLT — Additional Member Session',
  'Red Light Therapy Membership'
);

-- Deactivate any remaining inactive regenerative items
UPDATE pos_services SET active = false WHERE category = 'regenerative' AND active = true
AND name NOT IN ('Red Light Therapy — Intro (3 Sessions)');

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. SPECIALTY IV — deactivate duplicate renamed entries
-- ══════════════════════════════════════════════════════════════════════════════

-- These are duplicates of the originals (NAD+ 225mg, Glutathione 1g, etc.)
UPDATE pos_services SET active = false WHERE name IN (
  'NAD+ IV — 225mg',
  'NAD+ IV — 500mg',
  'NAD+ IV — 750mg',
  'NAD+ IV — 1000mg',
  'Glutathione IV — 1g',
  'Glutathione IV — 2g',
  'Glutathione IV — 3g',
  'High-Dose Vitamin C IV — 10g',
  'High-Dose Vitamin C IV — 15g',
  'High-Dose Vitamin C IV — 20g',
  'High-Dose Vitamin C IV — 25g',
  'High-Dose Vitamin C IV — 30g',
  'High-Dose Vitamin C IV — 35g',
  'High-Dose Vitamin C IV — 40g',
  'High-Dose Vitamin C IV — 45g',
  'High-Dose Vitamin C IV — 50g',
  'High-Dose Vitamin C IV — 55g',
  'High-Dose Vitamin C IV — 60g',
  'High-Dose Vitamin C IV — 65g',
  'High-Dose Vitamin C IV — 70g',
  'High-Dose Vitamin C IV — 75g',
  'Methylene Blue + High Dose Vitamin C + Magnesium'
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. IV THERAPY — deactivate duplicates
-- ══════════════════════════════════════════════════════════════════════════════

-- "The Range IV" duplicates "Range IV"
-- "Range IV — Additional Add-On" duplicates "IV Add-on"
-- "Range IV — Muscle Recovery & Performance" duplicates "Range IV — Muscle Recovery"
-- Glutathione pushes are standalone add-ons better handled as specialty IV
-- Mobile IV / IV Infusion are not standard services
UPDATE pos_services SET active = false WHERE name IN (
  'The Range IV',
  'Range IV — Additional Add-On',
  'Range IV — Muscle Recovery & Performance',
  'Glutathione Push — 400mg',
  'Glutathione Push — 600mg',
  'Mobile IV Service',
  'IV Infusion Service'
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. HRT — deactivate duplicates, keep "HRT Membership" + "HRT — Single Month"
-- ══════════════════════════════════════════════════════════════════════════════

UPDATE pos_services SET active = false WHERE name = 'HRT Monthly Membership';

-- Make sure HRT Membership is recurring and HRT Single Month is one-time
UPDATE pos_services SET recurring = true, interval = 'month'
WHERE name = 'HRT Membership' AND active = true;

UPDATE pos_services SET recurring = false
WHERE name = 'HRT — Single Month' AND active = true;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. INJECTIONS — deactivate old generic items (replaced by injection_standard/premium)
-- ══════════════════════════════════════════════════════════════════════════════

-- Old generic items in 'injections' category
UPDATE pos_services SET active = false WHERE category = 'injections';

-- Move NAD+ injection items from 'injections' to 'nad_injection' if any are there
UPDATE pos_services SET category = 'nad_injection'
WHERE category = 'injections' AND name LIKE 'NAD+ Injection%' AND active = true;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. NAD+ INJECTION 12-PACKS — add missing items
-- ══════════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS pos_services_name_unique ON pos_services(name);

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('NAD+ 50mg — 12-Pack (Pay for 10)',  'nad_injection', 25000, false, '12 NAD+ 50mg IM injections for the price of 10. MWF schedule, ~4 weeks.', 11010),
  ('NAD+ 75mg — 12-Pack (Pay for 10)',  'nad_injection', 37500, false, '12 NAD+ 75mg IM injections for the price of 10. MWF schedule, ~4 weeks.', 11011),
  ('NAD+ 100mg — 12-Pack (Pay for 10)', 'nad_injection', 50000, false, '12 NAD+ 100mg IM injections for the price of 10. MWF schedule, ~4 weeks.', 11012),
  ('NAD+ 125mg — 12-Pack (Pay for 10)', 'nad_injection', 62500, false, '12 NAD+ 125mg IM injections for the price of 10. MWF schedule, ~4 weeks.', 11013),
  ('NAD+ 150mg — 12-Pack (Pay for 10)', 'nad_injection', 75000, false, '12 NAD+ 150mg IM injections for the price of 10. MWF schedule, ~4 weeks.', 11014)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  price_cents = EXCLUDED.price_cents,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. Verify: count active services by category
-- ══════════════════════════════════════════════════════════════════════════════

SELECT category, COUNT(*) as active_count
FROM pos_services
WHERE active = true
GROUP BY category
ORDER BY category;
