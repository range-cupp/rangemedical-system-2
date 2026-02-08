-- Add pickup_frequency column to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS pickup_frequency TEXT;

-- Add a comment
COMMENT ON COLUMN protocols.pickup_frequency IS 'Weight loss pickup frequency: weekly, every_2_weeks, every_4_weeks';
