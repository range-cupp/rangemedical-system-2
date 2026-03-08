-- Add protocol-related columns to pos_services
-- Enables auto-protocol to know delivery method and duration for peptides

ALTER TABLE pos_services ADD COLUMN IF NOT EXISTS delivery_method TEXT;
ALTER TABLE pos_services ADD COLUMN IF NOT EXISTS duration_days INTEGER;

-- Set defaults for existing peptide products
UPDATE pos_services SET
  delivery_method = 'take_home',
  duration_days = CASE
    WHEN name LIKE '%10 Day%' THEN 10
    WHEN name LIKE '%20 Day%' THEN 20
    WHEN name LIKE '%30 Day%' THEN 30
    WHEN name LIKE '%7 Day%' THEN 7
    WHEN name LIKE '%14 Day%' THEN 14
    ELSE NULL
  END
WHERE category = 'peptide';
