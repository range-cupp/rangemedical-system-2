-- Add secondary_medication column to protocols table
-- Used for HRT protocols that include a secondary medication (Gonadorelin, HCG, Nandrolone)
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS secondary_medication TEXT;
