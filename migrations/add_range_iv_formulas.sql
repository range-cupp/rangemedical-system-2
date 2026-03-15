-- Add 4 Range IV signature formulas to pos_services for POS checkout
-- All $225 — same price as base Range IV, just pre-built combos

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order, active) VALUES
  ('Range IV — Immune Defense',              'iv_therapy', 22500, false, 'Vitamin C, Zinc, Glutathione, B-Complex, Magnesium. Immune support, antioxidant protection, infection defense.', 1, true),
  ('Range IV — Energy & Vitality',           'iv_therapy', 22500, false, 'B12, B-Complex, L-Carnitine, Magnesium, Vitamin C. Energy production, reduced fatigue, metabolic support.', 2, true),
  ('Range IV — Muscle Recovery & Performance','iv_therapy', 22500, false, 'Amino Acids, Magnesium, B-Complex, Vitamin C, Glutathione. Muscle repair, recovery acceleration, stress reduction.', 3, true),
  ('Range IV — Detox & Cellular Repair',     'iv_therapy', 22500, false, 'Glutathione, Vitamin C, NAC, Zinc, Magnesium. Liver support, oxidative stress defense, cellular repair.', 4, true)
ON CONFLICT (name) DO UPDATE SET
  price_cents = EXCLUDED.price_cents,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;
