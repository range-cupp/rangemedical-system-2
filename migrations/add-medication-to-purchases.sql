-- Add medication field to purchases for direct querying
-- Previously, medication name was only available via the linked protocol
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS medication TEXT;

-- Backfill from linked protocols where possible
UPDATE purchases p
SET medication = pr.medication
FROM protocols pr
WHERE p.protocol_id = pr.id
  AND p.medication IS NULL
  AND pr.medication IS NOT NULL;
