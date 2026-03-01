-- Add ghl_contact_id column to consents table
-- This column was missing, causing ALL consent inserts and queries to fail silently
-- because the consent-forms API and patient profile API both reference this column.
-- Range Medical

ALTER TABLE consents ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT;

-- Create index for faster lookups by ghl_contact_id
CREATE INDEX IF NOT EXISTS idx_consents_ghl_contact_id ON consents(ghl_contact_id);

-- Also create index on email and phone for fallback matching
CREATE INDEX IF NOT EXISTS idx_consents_email ON consents(email);
CREATE INDEX IF NOT EXISTS idx_consents_patient_id ON consents(patient_id);
