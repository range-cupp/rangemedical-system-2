-- Add appointment_id to tasks table so "Document encounter" tasks link to their appointment
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS appointment_id TEXT;

-- Index for lookup by appointment
CREATE INDEX IF NOT EXISTS idx_tasks_appointment_id ON tasks (appointment_id) WHERE appointment_id IS NOT NULL;
