-- 05052026-add-service-capacity.sql
-- Adds capacity (max concurrent bookings) to services so the scheduling
-- engine can stop double-booking shared physical resources — e.g., 2 HBOT
-- chambers and 1 Red Light bed at Newport Beach.
--
-- Default capacity is 1 (single resource = single booking at a time), which
-- preserves existing behavior for provider-bound services like HRT visits,
-- IVs, lab reviews, injections, etc.

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS max_concurrent_bookings INTEGER NOT NULL DEFAULT 1;

-- Newport Beach hardware: 2 hyperbaric oxygen chambers, 1 red light bed.
UPDATE services SET max_concurrent_bookings = 2 WHERE slug = 'hbot';
UPDATE services SET max_concurrent_bookings = 1 WHERE slug = 'red-light-therapy';
