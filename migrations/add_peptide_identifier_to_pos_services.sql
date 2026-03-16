-- Add peptide_identifier column to pos_services
-- Stores the specific peptide name (e.g., "BPC-157 (500mcg)") separately from the
-- generic Stripe-facing product name (e.g., "Peptide Therapy — 30 Day")
-- This keeps specific peptide names off merchant processing / customer receipts

ALTER TABLE pos_services ADD COLUMN IF NOT EXISTS peptide_identifier TEXT;
ALTER TABLE pos_services ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- Backfill existing peptide rows:
-- "Peptide Protocol — 30 Day — BPC-157 (500mcg)" →
--   name: "Peptide Therapy — 30 Day"
--   peptide_identifier: "BPC-157 (500mcg)"
--   sub_category: "Peptide Therapy — 30 Day"

-- Step 1: Extract peptide_identifier from 3-part names (peptide category)
UPDATE pos_services
SET peptide_identifier = trim(substring(name from ' — [^—]+ — (.+)$'))
WHERE category = 'peptide'
  AND name LIKE '%—%—%'
  AND peptide_identifier IS NULL;

-- Step 2: Set sub_category to the first two parts (duration group)
UPDATE pos_services
SET sub_category = trim(substring(name from '^(.+ — [^—]+) — '))
WHERE category = 'peptide'
  AND name LIKE '%—%—%'
  AND sub_category IS NULL;

-- Step 3: Trim the name down to just the generic first two parts
-- and rename "Peptide Protocol" → "Peptide Therapy"
UPDATE pos_services
SET name = replace(trim(substring(name from '^(.+ — [^—]+) — ')), 'Peptide Protocol', 'Peptide Therapy')
WHERE category = 'peptide'
  AND name LIKE '%—%—%';

-- Step 4: Also rename any sub_category references
UPDATE pos_services
SET sub_category = replace(sub_category, 'Peptide Protocol', 'Peptide Therapy')
WHERE category = 'peptide'
  AND sub_category LIKE '%Peptide Protocol%';

-- Step 5: Handle BDNF (2-part name like "BDNF Peptide Protocol — Phase 1")
UPDATE pos_services
SET peptide_identifier = trim(substring(name from ' — (.+)$')),
    sub_category = 'BDNF Peptide Therapy',
    name = 'BDNF Peptide Therapy'
WHERE category = 'peptide'
  AND name LIKE 'BDNF%'
  AND peptide_identifier IS NULL;
