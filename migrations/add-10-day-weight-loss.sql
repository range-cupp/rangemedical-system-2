-- Every 10-Day Weight Loss Programs
-- 3 injections per cycle (vs 4 for monthly), priced at 75% of monthly
-- Tirzepatide + Retatrutide at all dose levels
-- Run: 2026-04-15

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order, active) VALUES
  -- Tirzepatide 10-Day
  ('Tirzepatide — 10-Day (One-Time) — 2.5 mg',  'weight_loss', 29900, false, '3 Tirzepatide injections every 10 days — starting dose.', 7001, true),
  ('Tirzepatide — 10-Day (One-Time) — 5.0 mg',  'weight_loss', 41200, false, '3 Tirzepatide injections every 10 days — dose 2.', 7002, true),
  ('Tirzepatide — 10-Day (One-Time) — 7.5 mg',  'weight_loss', 44900, false, '3 Tirzepatide injections every 10 days — dose 3.', 7003, true),
  ('Tirzepatide — 10-Day (One-Time) — 10.0 mg', 'weight_loss', 48700, false, '3 Tirzepatide injections every 10 days — dose 4.', 7004, true),
  ('Tirzepatide — 10-Day (One-Time) — 12.5 mg', 'weight_loss', 52400, false, '3 Tirzepatide injections every 10 days — max dose.', 7005, true),
  -- Retatrutide 10-Day
  ('Retatrutide — 10-Day (One-Time) — 1 mg',  'weight_loss', 29900, false, '3 Retatrutide injections every 10 days — starting dose.', 7101, true),
  ('Retatrutide — 10-Day (One-Time) — 2 mg',  'weight_loss', 37400, false, '3 Retatrutide injections every 10 days — dose 2.', 7102, true),
  ('Retatrutide — 10-Day (One-Time) — 3 mg',  'weight_loss', 41200, false, '3 Retatrutide injections every 10 days — dose 3.', 7103, true),
  ('Retatrutide — 10-Day (One-Time) — 4 mg',  'weight_loss', 44900, false, '3 Retatrutide injections every 10 days — dose 4.', 7104, true),
  ('Retatrutide — 10-Day (One-Time) — 5 mg',  'weight_loss', 48700, false, '3 Retatrutide injections every 10 days — dose 5.', 7105, true),
  ('Retatrutide — 10-Day (One-Time) — 6 mg',  'weight_loss', 52400, false, '3 Retatrutide injections every 10 days — dose 6.', 7106, true),
  ('Retatrutide — 10-Day (One-Time) — 7 mg',  'weight_loss', 54300, false, '3 Retatrutide injections every 10 days — dose 7.', 7107, true),
  ('Retatrutide — 10-Day (One-Time) — 8 mg',  'weight_loss', 56200, false, '3 Retatrutide injections every 10 days — dose 8.', 7108, true),
  ('Retatrutide — 10-Day (One-Time) — 9 mg',  'weight_loss', 58100, false, '3 Retatrutide injections every 10 days — dose 9.', 7109, true),
  ('Retatrutide — 10-Day (One-Time) — 10 mg', 'weight_loss', 59900, false, '3 Retatrutide injections every 10 days — dose 10.', 7110, true),
  ('Retatrutide — 10-Day (One-Time) — 11 mg', 'weight_loss', 62200, false, '3 Retatrutide injections every 10 days — dose 11.', 7111, true),
  ('Retatrutide — 10-Day (One-Time) — 12 mg', 'weight_loss', 64400, false, '3 Retatrutide injections every 10 days — max dose.', 7112, true);
