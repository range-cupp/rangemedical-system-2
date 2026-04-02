-- Add 5-Amino-1MQ 50mg / SLUPP 1mg Oral Tablet Blend to POS
-- Range Medical — 2026-04-01
--
-- 30-day oral tablet blend, $197
-- Stripe-facing name: "Peptide Therapy — 30 Day" (generic)
-- Internal identifier: 5-Amino-1MQ / SLUPP

INSERT INTO pos_services (name, category, price_cents, recurring, peptide_identifier, sub_category, description, sort_order, active) VALUES
  ('Peptide Therapy — 30 Day', 'peptide', 19700, false, '5-Amino-1MQ / SLUPP', 'Oral Peptides', '5-Amino-1MQ 50mg / SLUPP 1mg oral tablet blend. 30-day supply.', 701, true)
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, sub_category = EXCLUDED.sub_category,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;
