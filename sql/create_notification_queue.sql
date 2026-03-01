-- Notification Queue Table
-- Range Medical - 2026-03-01
--
-- Stores messages that hit quiet hours (outside 7am-7pm PST)
-- Processed by /api/cron/send-notifications at 7 AM PST daily

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  channel TEXT NOT NULL,              -- 'sms' or 'email'
  message_type TEXT NOT NULL,         -- 'appointment_confirmation', 'appointment_cancellation', etc.
  recipient TEXT NOT NULL,            -- phone (E.164) or email address
  subject TEXT,                       -- email subject (null for SMS)
  message TEXT NOT NULL,              -- SMS body or email HTML
  scheduled_for TIMESTAMPTZ NOT NULL, -- when to send (next 7am PST)
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, sent, error
  error_message TEXT,
  metadata JSONB DEFAULT '{}',        -- extra context (appointment details, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_scheduled ON notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_patient ON notification_queue(patient_id);

-- Row Level Security
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON notification_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON notification_queue TO service_role;
