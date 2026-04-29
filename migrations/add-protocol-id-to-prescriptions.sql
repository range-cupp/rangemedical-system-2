-- Link prescriptions to the protocol they came from so the patient page
-- can render one source of truth (medication name, strength, sig) for both
-- the Active Medications view and the Prescriptions view.
ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS protocol_id uuid REFERENCES protocols(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS prescriptions_protocol_id_idx
  ON prescriptions(protocol_id)
  WHERE protocol_id IS NOT NULL;
