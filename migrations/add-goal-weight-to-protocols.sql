-- Add goal_weight column to protocols table
-- Stores the patient's target weight from weight loss encounter notes
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS goal_weight NUMERIC;
