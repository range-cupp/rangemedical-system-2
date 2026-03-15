-- Full Service Catalog Migration
-- Range Medical — 2026-03-15
--
-- 1. Fixes price column name (was 'price', code queries 'price_cents')
-- 2. Adds description column
-- 3. Upserts complete service catalog from master price list
-- Run in Supabase SQL editor

-- ── Column fixes ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Rename 'price' → 'price_cents' if it still has the old name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_services' AND column_name = 'price'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_services' AND column_name = 'price_cents'
  ) THEN
    ALTER TABLE pos_services RENAME COLUMN price TO price_cents;
  END IF;
END$$;

-- Add description column
ALTER TABLE pos_services ADD COLUMN IF NOT EXISTS description TEXT;

-- Add unique index for upsert
CREATE UNIQUE INDEX IF NOT EXISTS pos_services_name_unique ON pos_services(name);

-- ── Assessment ───────────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('Range Assessment', 'assessment', 25000, false, 'Initial consultation with provider. $250 credited toward any treatment started.', 1)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── Lab Panels ───────────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('Men''s Essential Panel',   'lab_panels', 35000, false, 'Hormones, thyroid, metabolic, lipids, CBC, vitamins, cortisol, PSA. Assessment special: $300.', 1),
  ('Men''s Elite Panel',       'lab_panels', 75000, false, 'Everything in Essential + advanced cardiovascular, inflammation, IGF-1, ferritin. Assessment special: $700.', 2),
  ('Women''s Essential Panel', 'lab_panels', 35000, false, 'Hormones, thyroid, metabolic, lipids, CBC, vitamins, cortisol. Assessment special: $300.', 3),
  ('Women''s Elite Panel',     'lab_panels', 75000, false, 'Everything in Essential + advanced cardiovascular, inflammation, IGF-1, ferritin. Assessment special: $700.', 4)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── IV Therapy ───────────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('Range IV',              'iv_therapy', 22500, false, 'Myers cocktail base — 5 nutrients. 30–60 min.', 1),
  ('NAD+ 225mg',            'iv_therapy', 37500, false, 'NAD+ 225mg IV infusion. ~2–4 hr.', 2),
  ('NAD+ 500mg',            'iv_therapy', 52500, false, 'NAD+ 500mg IV infusion. ~2–4 hr.', 3),
  ('NAD+ 750mg',            'iv_therapy', 65000, false, 'NAD+ 750mg IV infusion. ~3–4 hr.', 4),
  ('NAD+ 1000mg',           'iv_therapy', 77500, false, 'NAD+ 1000mg IV infusion. ~4 hr.', 5),
  ('Vitamin C 25g',         'iv_therapy', 21500, false, 'High-dose Vitamin C 25g IV. Immune support, anti-oxidant.', 6),
  ('Vitamin C 50g',         'iv_therapy', 25500, false, 'High-dose Vitamin C 50g IV.', 7),
  ('Vitamin C 75g',         'iv_therapy', 33000, false, 'High-dose Vitamin C 75g IV.', 8),
  ('Glutathione 1g',        'iv_therapy', 17000, false, 'Glutathione 1g IV push. Detox, skin, immune.', 9),
  ('Glutathione 2g',        'iv_therapy', 19000, false, 'Glutathione 2g IV push.', 10),
  ('Glutathione 3g',        'iv_therapy', 21500, false, 'Glutathione 3g IV push.', 11),
  ('MB + Vit C + Mag Combo','iv_therapy', 75000, false, 'Methylene Blue + Vitamin C + Magnesium IV combo. Mitochondrial support, energy, brain function, anti-inflammatory.', 12),
  ('IV Add-on',             'iv_therapy',  3500, false, 'Add-on nutrient to any IV ($35 each). B vitamins, amino acids, minerals, etc.', 13),
  ('Exosome IV',            'iv_therapy',     0, false, 'Exosome IV therapy. Pricing by consultation — varies by protocol.', 14)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── Injections ───────────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('Standard Injection',       'injections',  3500, false, 'B12, B-Complex, D3, Biotin, Amino Blend, NAC, BCAA — $35 each.', 1),
  ('Premium Injection',        'injections',  5000, false, 'L-Carnitine, Glutathione, MIC-B12 (Skinny Shot) — $50 each.', 2),
  ('NAD+ Injection 50mg',      'injections',  2500, false, 'NAD+ IM injection 50mg ($0.50/mg).', 3),
  ('NAD+ Injection 75mg',      'injections',  3750, false, 'NAD+ IM injection 75mg ($0.50/mg).', 4),
  ('NAD+ Injection 100mg',     'injections',  5000, false, 'NAD+ IM injection 100mg ($0.50/mg).', 5),
  ('NAD+ Injection 125mg',     'injections',  6250, false, 'NAD+ IM injection 125mg ($0.50/mg).', 6),
  ('NAD+ Injection 150mg',     'injections',  7500, false, 'NAD+ IM injection 150mg ($0.50/mg).', 7)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── HBOT — Single & Packs ────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('HBOT — Single Session',           'hbot',  18500, false, '60–90 min hyperbaric oxygen session.', 1),
  ('HBOT — 5-Session Pack',           'hbot',  85000, false, 'HBOT 5-pack ($170/session).', 2),
  ('HBOT — 10-Session Pack',          'hbot', 160000, false, 'HBOT 10-pack ($160/session).', 3),
  ('HBOT — Additional Member Session','hbot',  15000, false, 'Extra HBOT session for active members ($150).', 4)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── HBOT Memberships ─────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, interval, description, sort_order) VALUES
  ('HBOT Membership — 1x/Week', 'hbot',  54900, true, 'month', '4 sessions/mo ($137/ea). 3-month minimum.', 5),
  ('HBOT Membership — 2x/Week', 'hbot',  99900, true, 'month', '8 sessions/mo ($125/ea). 3-month minimum.', 6),
  ('HBOT Membership — 3x/Week', 'hbot', 139900, true, 'month', '12 sessions/mo ($117/ea). 3-month minimum.', 7)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── Red Light Therapy ────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('Red Light Therapy — Single',       'regenerative',  8500, false, '10–20 min RLT session.', 1),
  ('Red Light Therapy — 5-Pack',       'regenerative', 37500, false, 'RLT 5-pack ($75/session).', 2),
  ('Red Light Therapy — 10-Pack',      'regenerative', 60000, false, 'RLT 10-pack ($60/session).', 3),
  ('RLT — Additional Member Session',  'regenerative',  5000, false, 'Extra RLT session for active members ($50).', 4)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── RLT Membership ───────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, interval, description, sort_order) VALUES
  ('Red Light Therapy Membership', 'regenerative', 39900, true, 'month', 'Up to 12 sessions/mo ($33/ea). 3-month minimum.', 5)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── HBOT + RLT Combo Memberships ─────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, interval, description, sort_order) VALUES
  ('HBOT + RLT Combo — 1x/Week', 'hbot',  89900, true, 'month', '4 HBOT + 4 RLT per month. 3-month minimum.', 8),
  ('HBOT + RLT Combo — 2x/Week', 'hbot', 149900, true, 'month', '8 HBOT + 8 RLT per month. 3-month minimum.', 9),
  ('HBOT + RLT Combo — 3x/Week', 'hbot', 199900, true, 'month', '12 HBOT + 12 RLT per month. 3-month minimum.', 10)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── Packages ─────────────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('Six-Week Cellular Energy Reset',             'packages', 399900, false, '18 HBOT + 18 RLT, weekly check-ins, money-back guarantee.', 1),
  ('Cellular Energy Maintenance (4-Week)',        'packages',  59900, false, '4-week maintenance package.', 2),
  ('Cellular Energy Maintenance Premium (4-Week)','packages',  79900, false, '4-week premium maintenance package.', 3)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── PRP ──────────────────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('PRP — Single Injection',  'prp',  75000, false, 'Platelet-Rich Plasma — single injection. Joint, tendon, hair, or facial.', 1),
  ('PRP — 3-Injection Pack',  'prp', 180000, false, 'PRP 3-pack ($600/session, save $450).', 2)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── HRT Membership ───────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, interval, description, sort_order) VALUES
  ('HRT Membership', 'hrt', 25000, true, 'month', '$250/mo — all hormone meds, monthly Range IV ($225 value), follow-up labs, protocol adjustments, direct provider access.', 1)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── Weight Loss (GLP-1) ──────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, interval, description, sort_order) VALUES
  ('Semaglutide',          'weight_loss',  35000, true, 'month', 'GLP-1 weekly injection. Dose titrated monthly. All-inclusive.', 1),
  ('Tirzepatide — Dose 1', 'weight_loss',  39900, true, 'month', 'Tirzepatide (dual GIP/GLP-1) — starting dose.', 2),
  ('Tirzepatide — Dose 2', 'weight_loss',  54900, true, 'month', 'Tirzepatide — dose 2.', 3),
  ('Tirzepatide — Dose 3', 'weight_loss',  59900, true, 'month', 'Tirzepatide — dose 3.', 4),
  ('Tirzepatide — Dose 4', 'weight_loss',  64900, true, 'month', 'Tirzepatide — dose 4.', 5),
  ('Tirzepatide — Dose 5', 'weight_loss',  69900, true, 'month', 'Tirzepatide — max dose.', 6),
  ('Retatrutide — Dose 1', 'weight_loss',  49900, true, 'month', 'Retatrutide (triple agonist — newest/strongest) — starting dose.', 7),
  ('Retatrutide — Dose 2', 'weight_loss',  59900, true, 'month', 'Retatrutide — dose 2.', 8),
  ('Retatrutide — Dose 3', 'weight_loss',  69900, true, 'month', 'Retatrutide — dose 3.', 9),
  ('Retatrutide — Dose 4', 'weight_loss',  74900, true, 'month', 'Retatrutide — dose 4.', 10),
  ('Retatrutide — Dose 5', 'weight_loss',  79900, true, 'month', 'Retatrutide — dose 5.', 11),
  ('Retatrutide — Dose 6', 'weight_loss',  85900, true, 'month', 'Retatrutide — max dose.', 12)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── Peptide Protocols ────────────────────────────────────────────────────────

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('BPC-157 / TB-4 — 10-Day',              'peptide',  25000, false, 'BPC-157 + TB-500 blend. Injury healing, tissue repair, inflammation. 10-day supply.', 1),
  ('BPC-157 / TB-4 — 20-Day',              'peptide',  45000, false, 'BPC-157 + TB-500 blend. 20-day supply.', 2),
  ('BPC-157 / TB-4 — 30-Day',              'peptide',  67500, false, 'BPC-157 + TB-500 blend. 30-day supply.', 3),
  ('Recovery 4-Blend — 10-Day',            'peptide',  27500, false, 'BPC-157 + TB-4 + KPV + MGF. Enhanced tissue repair. 10-day supply.', 4),
  ('Recovery 4-Blend — 20-Day',            'peptide',  50000, false, 'Recovery 4-Blend. 20-day supply.', 5),
  ('Recovery 4-Blend — 30-Day',            'peptide',  72500, false, 'Recovery 4-Blend. 30-day supply.', 6),
  ('GHK-Cu — 30-Day',                      'peptide',  25000, false, 'Copper peptide. Skin health, collagen, anti-aging. 30-day supply.', 7),
  ('GLOW — 30-Day',                        'peptide',  40000, false, 'GHK-Cu + BPC-157 + TB-500 blend. Skin + healing. 30-day supply.', 8),
  ('MOTS-C Phase 1',                       'peptide',  40000, false, 'Mitochondrial peptide. Metabolic function, fat burning, endurance.', 9),
  ('MOTS-C Phase 2',                       'peptide',  70000, false, 'MOTS-C — phase 2 dose.', 10),
  ('2X Blend — Phase 1',                   'peptide',  40000, false, 'CJC-1295 + Ipamorelin or Tesamorelin + Ipamorelin. GH stimulation, body comp, sleep.', 11),
  ('2X Blend — Phase 2',                   'peptide',  45000, false, '2X Blend — phase 2 dose.', 12),
  ('2X Blend — Phase 3',                   'peptide',  50000, false, '2X Blend — phase 3 dose.', 13),
  ('3X Blend — Phase 1',                   'peptide',  42500, false, 'Tesamorelin + MGF + Ipamorelin. GH + muscle repair + recovery.', 14),
  ('3X Blend — Phase 2',                   'peptide',  47500, false, '3X Blend — phase 2 dose.', 15),
  ('3X Blend — Phase 3',                   'peptide',  52500, false, '3X Blend — phase 3 dose.', 16),
  ('4X Blend — Phase 1',                   'peptide',  45000, false, 'GHRP-2 + Tesamorelin + MGF + Ipamorelin. Strongest GH stack.', 17),
  ('4X Blend — Phase 2',                   'peptide',  50000, false, '4X Blend — phase 2 dose.', 18),
  ('4X Blend — Phase 3',                   'peptide',  55000, false, '4X Blend — phase 3 dose.', 19)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- Recurring peptide (cream)
INSERT INTO pos_services (name, category, price_cents, recurring, interval, description, sort_order) VALUES
  ('GHK-Cu Cream', 'peptide', 29900, true, 'month', 'Topical copper peptide cream. Skin rejuvenation, collagen, hair. Monthly supply.', 20)
ON CONFLICT (name) DO UPDATE SET price_cents = EXCLUDED.price_cents, description = EXCLUDED.description;

-- ── Deactivate outdated entries that were replaced ───────────────────────────
-- (Old seed data that has been superseded by the above)
UPDATE pos_services SET active = false WHERE name IN (
  'NAD+ 500mg',    -- replaced by tiered NAD+ entries above (same name OK, just ensure price is correct)
  'NAD+ 250mg',
  'Myers Cocktail',
  'Recovery IV',
  'Immunity IV',
  'Performance IV',
  'Inner Beauty IV',
  'B12 Shot',
  'HBOT — Additional Member Session',
  'Red Light Therapy',
  'RLT 10-Pack',
  'Testosterone Cypionate'
) AND name NOT IN (
  -- Don't deactivate any that were just upserted above
  SELECT name FROM pos_services WHERE name IN (
    'NAD+ 225mg','NAD+ 500mg','NAD+ 750mg','NAD+ 1000mg',
    'Range IV','MB + Vit C + Mag Combo',
    'HBOT — Single Session','HBOT — 5-Session Pack','HBOT — 10-Session Pack',
    'Red Light Therapy — Single','Red Light Therapy — 10-Pack',
    'HRT Membership'
  )
);

-- Re-activate the ones we explicitly inserted above
UPDATE pos_services SET active = true WHERE name IN (
  'Range IV','NAD+ 225mg','NAD+ 500mg','NAD+ 750mg','NAD+ 1000mg',
  'Vitamin C 25g','Vitamin C 50g','Vitamin C 75g',
  'Glutathione 1g','Glutathione 2g','Glutathione 3g',
  'MB + Vit C + Mag Combo','IV Add-on','Exosome IV',
  'Standard Injection','Premium Injection',
  'NAD+ Injection 50mg','NAD+ Injection 75mg','NAD+ Injection 100mg',
  'NAD+ Injection 125mg','NAD+ Injection 150mg',
  'HBOT — Single Session','HBOT — 5-Session Pack','HBOT — 10-Session Pack',
  'HBOT — Additional Member Session',
  'HBOT Membership — 1x/Week','HBOT Membership — 2x/Week','HBOT Membership — 3x/Week',
  'Red Light Therapy — Single','Red Light Therapy — 5-Pack','Red Light Therapy — 10-Pack',
  'RLT — Additional Member Session','Red Light Therapy Membership',
  'HBOT + RLT Combo — 1x/Week','HBOT + RLT Combo — 2x/Week','HBOT + RLT Combo — 3x/Week',
  'Six-Week Cellular Energy Reset',
  'Cellular Energy Maintenance (4-Week)','Cellular Energy Maintenance Premium (4-Week)',
  'PRP — Single Injection','PRP — 3-Injection Pack',
  'HRT Membership',
  'Semaglutide',
  'Tirzepatide — Dose 1','Tirzepatide — Dose 2','Tirzepatide — Dose 3',
  'Tirzepatide — Dose 4','Tirzepatide — Dose 5',
  'Retatrutide — Dose 1','Retatrutide — Dose 2','Retatrutide — Dose 3',
  'Retatrutide — Dose 4','Retatrutide — Dose 5','Retatrutide — Dose 6',
  'BPC-157 / TB-4 — 10-Day','BPC-157 / TB-4 — 20-Day','BPC-157 / TB-4 — 30-Day',
  'Recovery 4-Blend — 10-Day','Recovery 4-Blend — 20-Day','Recovery 4-Blend — 30-Day',
  'GHK-Cu — 30-Day','GHK-Cu Cream','GLOW — 30-Day',
  'MOTS-C Phase 1','MOTS-C Phase 2',
  '2X Blend — Phase 1','2X Blend — Phase 2','2X Blend — Phase 3',
  '3X Blend — Phase 1','3X Blend — Phase 2','3X Blend — Phase 3',
  '4X Blend — Phase 1','4X Blend — Phase 2','4X Blend — Phase 3',
  'Range Assessment',
  'Men''s Essential Panel','Men''s Elite Panel','Women''s Essential Panel','Women''s Elite Panel'
);
