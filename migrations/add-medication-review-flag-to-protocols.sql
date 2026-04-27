-- Add medication-review flag to protocols
-- When a protocol is auto-created from a purchase (HRT, weight loss, etc.),
-- the provider needs to verify the medication, dose, and sig before dispense.
-- This flag drives the "Needs Provider Review" badge in the patient page.
-- 2026-04-27

ALTER TABLE protocols
  ADD COLUMN IF NOT EXISTS needs_medication_review BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS medication_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS medication_verified_by UUID REFERENCES employees(id);

COMMENT ON COLUMN protocols.needs_medication_review IS 'TRUE when an auto-created protocol (e.g., HRT from Stripe purchase) needs the provider to verify medication, dose, sig before dispense.';
COMMENT ON COLUMN protocols.medication_verified_at IS 'Timestamp when medication was verified by a provider.';
COMMENT ON COLUMN protocols.medication_verified_by IS 'employees.id of the provider who verified the medication.';

CREATE INDEX IF NOT EXISTS idx_protocols_needs_review ON protocols(needs_medication_review) WHERE needs_medication_review = TRUE;
