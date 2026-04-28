-- Decouple WL check-in SMS cadence from injection cadence.
-- When NULL (the default), the cron falls back to the protocol's frequency
-- so existing protocols keep current behavior. Set to 7/10/14/etc. to send
-- check-in messages on a different cadence than the injections themselves
-- (e.g. weekly injections but biweekly check-ins for low-engagement patients).

ALTER TABLE protocols
  ADD COLUMN IF NOT EXISTS checkin_cadence_days INTEGER;
