-- Add Selank + Semax 30-Day protocols to POS
-- Range Medical — 2026-04-07
--
-- Only the 30-day protocol is offered (no 10/20-day variants).
-- Flat $395 for both Selank and Semax.

INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — 30 Day Protocol', 'peptide', 29500, false, 'Selank', 'Cognitive Peptides', 'Anxiolytic peptide. 30-day protocol — daily 250–500mcg.', 603, true),
  ('Peptide Therapy — 30 Day Protocol', 'peptide', 29500, false, 'Semax',  'Cognitive Peptides', 'Nootropic peptide. 30-day protocol — daily 500mcg–1mg.',  613, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents  = EXCLUDED.price_cents,
  sub_category = EXCLUDED.sub_category,
  description  = EXCLUDED.description,
  sort_order   = EXCLUDED.sort_order,
  active       = true;
