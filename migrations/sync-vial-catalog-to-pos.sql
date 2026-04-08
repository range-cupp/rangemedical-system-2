-- Sync full vial catalog into POS services at catalog pricing
-- Range Medical — 2026-04-03
--
-- Replaces the old partial vial list (7 items at stale prices)
-- with the complete vial catalog (21 items at current catalog pricing).

-- ── Step 1: Deactivate all existing vial items ────────────────────────────────
UPDATE pos_services SET active = false WHERE category = 'vials';

-- ── Step 2: Upsert all vial catalog items ─────────────────────────────────────

-- Recovery
INSERT INTO pos_services (name, category, price_cents, recurring, active, sort_order, description) VALUES
  ('BPC-157 / Thymosin Beta-4 Vial',       'vials', 33000, false, true, 13001, 'Recovery blend. 10mg/10mg vial, 20 injections.'),
  ('Recovery 4-Blend Vial',                 'vials', 33000, false, true, 13002, 'KPV/BPC-157/TB-500/MGF enhanced recovery blend. 20 injections.'),
  ('BPC-157 Standalone Vial',               'vials', 13200, false, true, 13003, 'BPC-157 5mg vial. 10–20 injections.')
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, active = true, sort_order = EXCLUDED.sort_order, description = EXCLUDED.description;

-- Growth Hormone
INSERT INTO pos_services (name, category, price_cents, recurring, active, sort_order, description) VALUES
  ('2X Blend Vial — CJC-1295 / Ipamorelin', 'vials', 17500, false, true, 13010, 'GH secretagogue blend. 10 injections, 30-day supply.'),
  ('3X Blend Vial — Tesa / MGF / Ipamorelin','vials', 17500, false, true, 13011, 'Triple-action GH blend. 10 injections, 30-day supply.'),
  ('4X Blend Vial — GHRP-2 / Tesa / MGF / Ipa','vials', 17500, false, true, 13012, 'Maximum-potency GH blend. 10 injections, 30-day supply.')
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, active = true, sort_order = EXCLUDED.sort_order, description = EXCLUDED.description;

-- Longevity & Specialty
INSERT INTO pos_services (name, category, price_cents, recurring, active, sort_order, description) VALUES
  ('NAD+ 1000mg Vial',    'vials', 50000, false, true, 13020, 'NAD+ 1000mg injection vial. 5–20 injections.'),
  ('MOTS-C Vial',         'vials', 17500, false, true, 13021, 'Mitochondrial peptide 10mg vial. 2–10 injections.'),
  ('GHK-Cu Vial',         'vials', 16500, false, true, 13022, 'Copper peptide 50mg vial. 25–50 injections.'),
  ('Epithalon Vial',      'vials', 29700, false, true, 13023, 'Telomere peptide 50mg vial. 5 injections (20-day cycle).'),
  ('SS-31 Vial',          'vials', 46200, false, true, 13024, 'Elamipretide 50mg vial. 25–50 injections.'),
  ('AOD-9604 Vial',       'vials', 29700, false, true, 13025, 'Fat loss peptide vial. 30 injections.'),
  ('Follistatin Vial',    'vials', 52800, false, true, 13026, 'Myostatin inhibitor vial. 20 injections.'),
  ('HGH 100iu Vial',      'vials', 99000, false, true, 13027, 'Recombinant human growth hormone 100iu vial.'),
  ('IGF-LR3 Vial',        'vials', 29700, false, true, 13028, 'Long-acting growth factor vial.')
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, active = true, sort_order = EXCLUDED.sort_order, description = EXCLUDED.description;

-- Neuro & Sleep
INSERT INTO pos_services (name, category, price_cents, recurring, active, sort_order, description) VALUES
  ('Selank Vial',  'vials', 19800, false, true, 13030, 'Anxiolytic peptide vial for focus and calm.'),
  ('Semax Vial',   'vials', 19800, false, true, 13031, 'Cognitive peptide vial for memory and clarity.'),
  ('DSIP Vial',    'vials', 13200, false, true, 13032, 'Delta sleep-inducing peptide 10mg vial. 10–20 injections.')
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, active = true, sort_order = EXCLUDED.sort_order, description = EXCLUDED.description;

-- Immune
INSERT INTO pos_services (name, category, price_cents, recurring, active, sort_order, description) VALUES
  ('Thymosin Alpha-1 Vial', 'vials', 36300, false, true, 13040, 'TA1 immune modulator vial.'),
  ('ARA-290 Vial',           'vials', 29700, false, true, 13041, 'Neuroprotective peptide vial for inflammation and tissue repair.')
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, active = true, sort_order = EXCLUDED.sort_order, description = EXCLUDED.description;

-- Sexual Health
INSERT INTO pos_services (name, category, price_cents, recurring, active, sort_order, description) VALUES
  ('PT-141 Vial', 'vials', 13200, false, true, 13050, 'Bremelanotide vial for sexual health.')
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, active = true, sort_order = EXCLUDED.sort_order, description = EXCLUDED.description;
