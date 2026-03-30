-- Add send_notification flag to appointments table
-- When false, suppresses confirmation SMS/email AND booking automations
-- (prep instructions, form sends, prereq checks)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS send_notification boolean DEFAULT true;
