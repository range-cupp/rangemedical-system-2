-- Migration: Add `username` column to employees (provider slug)
-- Range Medical
-- Applied: 2026-05-06
--
-- Purpose: Replace the hardcoded FRIENDLY_USERNAME_BY_CALCOM_USER_ID map
-- duplicated across event-types, provider-schedules, and the booking
-- engine. With the slug on the employees row, adding a new bookable
-- provider is a single DB change instead of a code change in three places.
--
-- The username is the lowercase slug used by:
--   - CalendarView's per-column slot matching (host.username ↔
--     providerFirstName from lib/scheduling.js)
--   - provider-schedules API responses keyed by friendly slug
--
-- Same shape as the legacy Cal.com username, so no client-side code has
-- to change beyond reading from a different source.

ALTER TABLE employees ADD COLUMN IF NOT EXISTS username TEXT;

-- Unique when set; multiple NULLs are allowed for non-bookable employees.
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_username
  ON employees(username) WHERE username IS NOT NULL;

-- Backfill from the legacy FRIENDLY_USERNAME_BY_CALCOM_USER_ID map.
UPDATE employees SET username = 'chris'   WHERE calcom_user_id = 2189658 AND username IS NULL;
UPDATE employees SET username = 'damien'  WHERE calcom_user_id = 2197563 AND username IS NULL;
UPDATE employees SET username = 'lily'    WHERE calcom_user_id = 2197567 AND username IS NULL;
UPDATE employees SET username = 'evan'    WHERE calcom_user_id = 2197566 AND username IS NULL;
UPDATE employees SET username = 'damon'   WHERE calcom_user_id = 2197565 AND username IS NULL;
UPDATE employees SET username = 'brendyn' WHERE calcom_user_id = 2383086 AND username IS NULL;

-- Tara appears in the legacy PROVIDERS map (medication_pickup) with
-- username 'tara' but has no calcom_user_id — backfill by name.
UPDATE employees SET username = 'tara' WHERE name = 'Tara' AND username IS NULL;
