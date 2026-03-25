-- Add html_body column to comms_log for storing rendered email HTML
ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS html_body TEXT;

COMMENT ON COLUMN comms_log.html_body IS 'Full rendered HTML of outgoing emails, stored at send time';
