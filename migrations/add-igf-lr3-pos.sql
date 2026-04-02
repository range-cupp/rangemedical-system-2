-- Add IGF-LR3 to POS
-- Range Medical — 2026-04-01
--
-- IGF-LR3: $800 total, charged as $200/week × 4 weeks
-- Stripe-facing name: "Peptide Therapy — 7 Day" (generic)
-- Internal identifier: IGF-LR3

INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — 7 Day', 'peptide', 20000, false, 'IGF-LR3', 'IGF-LR3', 'IGF-LR3 peptide therapy. 7-day supply ($200/week, $800 total program).', 601, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, sub_category = EXCLUDED.sub_category,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;
