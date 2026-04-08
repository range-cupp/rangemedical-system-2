-- Range Medical — 2026-04-08
-- Fill peptide POS gaps:
--   • Add HCG vial + 30-day pack (12 × 500mcg)
--   • Add Epithalon 10/20-day packs (protocol is daily × 20 days, no 30-day)
--   • Add SS-31 30-day pack
--   • Add KLOW + GLOW vials
--   • Remove HGH 100iu vial from POS

-- ── HCG ───────────────────────────────────────────────────────────────────────
INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('HCG Vial',                          'vials',   22500, false, NULL,  NULL,                'HCG vial — ~1 month supply.',                                       13060, true),
  ('Peptide Therapy — 30 Day Protocol', 'peptide', 30000, false, 'HCG', 'Sexual Health',     'HCG 30-day protocol. 12 injections of 500mcg.',                     701,   true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents  = EXCLUDED.price_cents,
  sub_category = EXCLUDED.sub_category,
  description  = EXCLUDED.description,
  sort_order   = EXCLUDED.sort_order,
  active       = true;

-- ── Epithalon (10/20-day only — protocol is daily × 20 days) ──────────────────
INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — 10 Day Protocol', 'peptide', 25000, false, 'Epithalon', 'Longevity', 'Telomere peptide. 10-day protocol — daily 10mg.', 621, true),
  ('Peptide Therapy — 20 Day Protocol', 'peptide', 45000, false, 'Epithalon', 'Longevity', 'Telomere peptide. 20-day protocol — daily 10mg.', 622, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents  = EXCLUDED.price_cents,
  sub_category = EXCLUDED.sub_category,
  description  = EXCLUDED.description,
  sort_order   = EXCLUDED.sort_order,
  active       = true;

-- ── SS-31 (30-day pack) ───────────────────────────────────────────────────────
INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — 30 Day Protocol', 'peptide', 92500, false, 'SS-31', 'Longevity', 'Elamipretide. 30-day protocol — daily 1–2mg.', 631, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents  = EXCLUDED.price_cents,
  sub_category = EXCLUDED.sub_category,
  description  = EXCLUDED.description,
  sort_order   = EXCLUDED.sort_order,
  active       = true;

-- ── KLOW + GLOW vials ─────────────────────────────────────────────────────────
INSERT INTO pos_services (name, category, price_cents, recurring, active, sort_order, description) VALUES
  ('KLOW Vial', 'vials', 40000, false, true, 13004, 'KLOW recovery blend vial. 20 injections.'),
  ('GLOW Vial', 'vials', 40000, false, true, 13005, 'GLOW (GHK-Cu + Recovery) blend vial. 20 injections.')
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, active = true, sort_order = EXCLUDED.sort_order, description = EXCLUDED.description;

-- ── Remove HGH 100iu from POS ─────────────────────────────────────────────────
UPDATE pos_services SET active = false WHERE name = 'HGH 100iu Vial';
