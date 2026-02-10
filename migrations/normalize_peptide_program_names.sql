-- Normalize bare duration names on existing peptide protocols to "Peptide Therapy"
-- Matches: "7 Day", "10 Day", "14 Day", "20 Day", "30 Day", "Peptide - 7 Day", etc.
UPDATE protocols
SET program_name = 'Peptide Therapy',
    updated_at = now()
WHERE program_type = 'peptide'
  AND (program_name ~ '^\d+\s*Day$' OR program_name ~ '^Peptide\s*-\s*\d+\s*Day$');
