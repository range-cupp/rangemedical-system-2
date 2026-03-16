-- Add checked_in_at timestamp to appointments table
-- Records exact Pacific time when front desk marks patient as checked in
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_checked_in_at
  ON appointments(checked_in_at) WHERE checked_in_at IS NOT NULL;
