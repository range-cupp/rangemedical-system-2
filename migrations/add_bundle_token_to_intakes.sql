-- Add bundle_token column to intakes table
-- Links intake submissions directly to their form bundle for reliable completion tracking
ALTER TABLE intakes ADD COLUMN IF NOT EXISTS bundle_token text;

-- Index for fast lookup by bundle_token
CREATE INDEX IF NOT EXISTS idx_intakes_bundle_token ON intakes(bundle_token) WHERE bundle_token IS NOT NULL;
