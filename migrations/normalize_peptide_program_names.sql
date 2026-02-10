-- Normalize bare duration names on existing take-home peptide protocols
-- "7 Day" → "Peptide Therapy - 7 Days", "Peptide - 30 Day" → "Peptide Therapy - 30 Days", etc.
-- Run via migrations/fix_peptide_names_with_duration.js (uses JS to derive days from start/end dates)
-- This SQL version handles any remaining bare patterns:
UPDATE protocols
SET program_name = 'Peptide Therapy - ' || (regexp_match(program_name, '(\d+)'))[1] || ' Days',
    updated_at = now()
WHERE program_type = 'peptide'
  AND delivery_method = 'take_home'
  AND (program_name ~ '^\d+\s*Day$' OR program_name ~ '^Peptide\s*-\s*\d+\s*Day$');
