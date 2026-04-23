-- migrations/alter_trial_passes_add_scheduling.sql
-- Adds self-booking + no-show card fields to trial_passes for the free-session flow.
-- 2026-04-23

ALTER TABLE trial_passes
  ADD COLUMN IF NOT EXISTS scheduled_start_time       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS calcom_booking_uid         TEXT,
  ADD COLUMN IF NOT EXISTS calcom_booking_id          BIGINT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id         TEXT,
  ADD COLUMN IF NOT EXISTS stripe_setup_intent_id     TEXT,
  ADD COLUMN IF NOT EXISTS no_show_payment_method_id  TEXT,
  ADD COLUMN IF NOT EXISTS no_show_amount_cents       INTEGER DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS no_show_agreed_at          TIMESTAMPTZ;

COMMENT ON COLUMN trial_passes.scheduled_start_time      IS 'Cal.com appointment start time the prospect self-booked.';
COMMENT ON COLUMN trial_passes.calcom_booking_uid        IS 'Cal.com booking UID for the scheduled free session.';
COMMENT ON COLUMN trial_passes.calcom_booking_id         IS 'Cal.com numeric booking ID.';
COMMENT ON COLUMN trial_passes.no_show_payment_method_id IS 'Stripe payment_method id saved via SetupIntent; charge up to no_show_amount_cents on no-show.';
COMMENT ON COLUMN trial_passes.no_show_agreed_at         IS 'Timestamp when the prospect agreed to the no-show fee terms.';
