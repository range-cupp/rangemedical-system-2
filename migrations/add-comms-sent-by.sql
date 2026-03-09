-- Add employee tracking to comms_log for staff-composed emails
-- Run in Supabase SQL Editor

ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS sent_by_employee_id UUID REFERENCES employees(id);
ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS sent_by_employee_name TEXT;

-- Index for looking up emails sent by a specific employee
CREATE INDEX IF NOT EXISTS idx_comms_log_sent_by ON comms_log(sent_by_employee_id) WHERE sent_by_employee_id IS NOT NULL;
