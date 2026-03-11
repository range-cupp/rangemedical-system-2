-- Prescriptions table — scaffolding for future e-prescribing
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id TEXT,
  note_id UUID REFERENCES patient_notes(id) ON DELETE SET NULL,

  -- Medication details
  medication_name TEXT NOT NULL,
  strength TEXT,
  form TEXT,
  quantity TEXT,
  sig TEXT,
  refills INTEGER DEFAULT 0,
  days_supply INTEGER,
  daw BOOLEAN DEFAULT false,

  -- Classification
  is_controlled BOOLEAN DEFAULT false,
  schedule TEXT,
  category TEXT,

  -- Prescriber info
  prescriber_name TEXT,
  prescriber_npi TEXT,
  prescriber_dea TEXT,

  -- Pharmacy
  pharmacy_name TEXT,
  pharmacy_phone TEXT,
  pharmacy_fax TEXT,
  pharmacy_npi TEXT,

  -- Status tracking
  status TEXT DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- CURES integration
  cures_checked BOOLEAN DEFAULT false,
  cures_checked_at TIMESTAMPTZ,
  cures_checked_by TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id ON prescriptions(appointment_id) WHERE appointment_id IS NOT NULL;

-- CURES check log
CREATE TABLE IF NOT EXISTS cures_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  checked_by TEXT NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  report_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cures_checks_patient_id ON cures_checks(patient_id);
