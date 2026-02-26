-- Appointments + Appointment Events tables
-- Range Medical native calendar system

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  service_name TEXT NOT NULL,
  service_category TEXT,
  provider TEXT,
  location TEXT DEFAULT 'Range Medical — Newport Beach',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES appointments(id),
  source TEXT DEFAULT 'manual',
  cal_com_booking_id TEXT,
  ghl_appointment_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_cal_com ON appointments(cal_com_booking_id);

-- Appointment events (audit log)
CREATE TABLE IF NOT EXISTS appointment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointment_events_appointment_id ON appointment_events(appointment_id);
CREATE INDEX idx_appointment_events_event_type ON appointment_events(event_type);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();
