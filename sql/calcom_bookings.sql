-- Cal.com Bookings Table
-- Range Medical - 2026-02-22
--
-- Stores all bookings created via Cal.com (staff-booked and patient-booked)
-- Synced via API calls and Cal.com webhooks

CREATE TABLE IF NOT EXISTS calcom_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calcom_booking_id INTEGER UNIQUE,
  calcom_uid TEXT,

  -- Patient info
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  patient_email TEXT,
  patient_phone TEXT,

  -- Service info
  service_name TEXT,
  service_slug TEXT,
  calcom_event_type_id INTEGER,

  -- Scheduling
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  booking_date DATE NOT NULL,
  duration_minutes INTEGER,

  -- Status: scheduled, confirmed, completed, cancelled, no_show
  status TEXT NOT NULL DEFAULT 'scheduled',

  -- Details
  location TEXT,
  notes TEXT,
  booked_by TEXT DEFAULT 'staff', -- staff or patient

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_calcom_bookings_patient ON calcom_bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_calcom_bookings_date ON calcom_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_calcom_bookings_status ON calcom_bookings(status);
CREATE INDEX IF NOT EXISTS idx_calcom_bookings_start ON calcom_bookings(start_time);

-- Row Level Security
ALTER TABLE calcom_bookings ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON calcom_bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON calcom_bookings TO service_role;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_calcom_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calcom_bookings_updated_at ON calcom_bookings;
CREATE TRIGGER calcom_bookings_updated_at
  BEFORE UPDATE ON calcom_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_calcom_bookings_updated_at();
