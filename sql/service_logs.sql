-- Service Logs Table
-- Range Medical - 2026-02-09
--
-- Unified log for ALL services delivered:
-- - Injections (testosterone, weight loss, vitamins, peptides)
-- - Medication pickups
-- - Sessions (IV therapy, HBOT, Red Light)

CREATE TABLE IF NOT EXISTS service_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  protocol_id UUID REFERENCES protocols(id),

  -- What was done
  category TEXT NOT NULL, -- testosterone, weight_loss, vitamin, peptide, iv_therapy, hbot, red_light
  entry_type TEXT NOT NULL DEFAULT 'injection', -- injection, pickup, session
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Details
  medication TEXT,
  dosage TEXT,
  weight NUMERIC(5,1), -- For weight loss tracking
  quantity INTEGER, -- For pickups (number of vials/syringes)
  supply_type TEXT, -- vial_10ml, prefilled_2week, prefilled_4week, etc.
  duration INTEGER, -- For sessions (minutes)

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID -- Staff member who logged it
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_service_logs_patient ON service_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_category ON service_logs(category);
CREATE INDEX IF NOT EXISTS idx_service_logs_entry_date ON service_logs(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_logs_created_at ON service_logs(created_at DESC);

-- Row Level Security
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON service_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON service_logs TO service_role;

-- Add patient_name column for denormalized storage (optional, for faster reads)
-- ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS patient_name TEXT;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_service_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS service_logs_updated_at ON service_logs;
CREATE TRIGGER service_logs_updated_at
  BEFORE UPDATE ON service_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_service_logs_updated_at();

-- ============================================
-- OPTIONAL: Migrate data from injection_logs
-- ============================================
-- Run this AFTER creating the table if you want to migrate existing data:
--
-- INSERT INTO service_logs (
--   id, patient_id, protocol_id, category, entry_type, entry_date,
--   medication, dosage, weight, quantity, notes, created_at
-- )
-- SELECT
--   id, patient_id, protocol_id, category, entry_type, entry_date,
--   medication, dosage, weight, quantity, notes, created_at
-- FROM injection_logs
-- WHERE NOT EXISTS (SELECT 1 FROM service_logs WHERE service_logs.id = injection_logs.id);
