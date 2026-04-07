-- Adds protocol versioning so dose changes close the current protocol
-- (status='historic') and create a new active protocol that inherits
-- remaining vial supply from the parent.
--
-- - parent_protocol_id: links a new protocol to the historic one it
--   replaced after a dose change.
-- - dose_change_reason: optional note captured at the moment of switch.
-- - starting_supply_ml: ml carried over from the parent protocol so the
--   new protocol's "weeks left" calculation is accurate without waiting
--   for the next dispense.

ALTER TABLE protocols
  ADD COLUMN IF NOT EXISTS parent_protocol_id UUID REFERENCES protocols(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dose_change_reason TEXT,
  ADD COLUMN IF NOT EXISTS starting_supply_ml NUMERIC(8,2);

CREATE INDEX IF NOT EXISTS idx_protocols_parent_protocol_id ON protocols(parent_protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocols_status_patient ON protocols(patient_id, status);
