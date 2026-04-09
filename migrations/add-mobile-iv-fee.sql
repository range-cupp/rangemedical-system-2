-- Add Mobile IV Fee to pos_services
-- $200 travel fee for nurse to provide IV at patient's location
INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order, active)
VALUES ('Mobile IV Fee', 'iv_therapy', 20000, false, 'Travel fee for nurse to provide IV at patient location ($200)', 11, true);
