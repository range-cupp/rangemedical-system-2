-- Range Medical — 2026-04-11
-- Add 2X Blend Vial — Tesamorelin / Ipamorelin to POS ($175)

INSERT INTO pos_services (name, category, price_cents, recurring, active, sort_order, description)
VALUES ('2X Blend Vial — Tesamorelin / Ipamorelin', 'vials', 17500, false, true, 13013, 'GH secretagogue blend with tesamorelin for visceral fat reduction. 10 injections, 30-day supply.')
ON CONFLICT (name, COALESCE(peptide_identifier, '')) DO UPDATE SET
  price_cents = EXCLUDED.price_cents, active = true, sort_order = EXCLUDED.sort_order, description = EXCLUDED.description;
