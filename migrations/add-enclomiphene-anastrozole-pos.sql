-- Add Enclomiphene and Enclomiphene/Anastrozole to POS
-- Range Medical — 2026-04-28
--
-- Front-desk checkout items:
--   • Enclomiphene / Anastrozole — $119 (combo testosterone booster)
--   • Enclomiphene — $109 (solo testosterone booster)
--
-- Category: hrt — appears under "Optimization → HRT" in the checkout flow.

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order, active) VALUES
  ('Enclomiphene / Anastrozole', 'hrt', 11900, false, 'Oral testosterone booster — Enclomiphene + Anastrozole combo. 30-day supply.', 5002, true),
  ('Enclomiphene',                'hrt', 10900, false, 'Oral testosterone booster — Enclomiphene. 30-day supply.', 5003, true)
ON CONFLICT (name, COALESCE(peptide_identifier, ''))
DO UPDATE SET
  price_cents = EXCLUDED.price_cents,
  category    = EXCLUDED.category,
  description = EXCLUDED.description,
  sort_order  = EXCLUDED.sort_order,
  active      = true,
  updated_at  = now();
