-- Add HRT take-home injection reminder fields to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS hrt_reminders_enabled BOOLEAN DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS hrt_reminder_schedule TEXT;
