-- Methylene Blue Oral Capsules 25mg: replace single 30-day item with 10/20/30-day tiers
-- Pricing: 10-day $79, 20-day $149, 30-day $217

-- Deactivate existing single item(s)
UPDATE pos_services
SET active = false, updated_at = now()
WHERE lower(name) LIKE '%methylene blue%oral%'
  AND active = true;

-- Insert tiered items
INSERT INTO pos_services (name, category, price_cents, recurring, description, duration_days, sort_order, active)
VALUES
  ('Methylene Blue Oral Capsules 25mg — 10 Day', 'supplements', 7900,  false, '10-day supply of Methylene Blue oral capsules (25mg). Mitochondrial support, cognitive enhancement, cellular energy.', 10, 1, true),
  ('Methylene Blue Oral Capsules 25mg — 20 Day', 'supplements', 14900, false, '20-day supply of Methylene Blue oral capsules (25mg). Mitochondrial support, cognitive enhancement, cellular energy.', 20, 2, true),
  ('Methylene Blue Oral Capsules 25mg — 30 Day', 'supplements', 21700, false, '30-day supply of Methylene Blue oral capsules (25mg). Mitochondrial support, cognitive enhancement, cellular energy.', 30, 3, true);
