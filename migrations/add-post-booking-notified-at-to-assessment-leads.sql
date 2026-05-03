-- Add post_booking_notified_at to assessment_leads.
-- Used by lib/assessment-post-booking.js as an idempotency guard so a retry of
-- /api/assessment/book doesn't fire duplicate intake emails or follow-up tasks.
--
-- Idempotent: safe to re-run.

ALTER TABLE assessment_leads
  ADD COLUMN IF NOT EXISTS post_booking_notified_at TIMESTAMPTZ;

COMMENT ON COLUMN assessment_leads.post_booking_notified_at IS
  'Timestamp when intake email + follow-up task + pipeline insert fired for this lead. NULL until the booking step completes the first time.';
