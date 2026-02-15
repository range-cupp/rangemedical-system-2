-- Create comms_log table: unified log of all automated SMS and email communications
-- Run in Supabase SQL Editor

CREATE TABLE comms_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID,
  protocol_id UUID,
  ghl_contact_id TEXT,
  patient_name TEXT,
  channel TEXT NOT NULL,         -- 'sms' or 'email'
  message_type TEXT NOT NULL,    -- e.g. 'peptide_followup', 'drip_email_1', 'wl_checkin'
  recipient TEXT,                -- email address (null for SMS)
  subject TEXT,                  -- email subject line (null for SMS)
  message TEXT,                  -- message body
  status TEXT DEFAULT 'sent',    -- 'sent' or 'error'
  error_message TEXT,
  source TEXT,                   -- file that sent it, e.g. 'peptide-reminders'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comms_log_created ON comms_log(created_at DESC);
CREATE INDEX idx_comms_log_patient ON comms_log(patient_id);
CREATE INDEX idx_comms_log_channel ON comms_log(channel);

-- ============================================================
-- BACKFILL: Import existing communications from protocol_logs
-- ============================================================

-- From protocol_logs (drip emails, peptide texts, checkin texts)
INSERT INTO comms_log (patient_id, protocol_id, channel, message_type, message, status, source, created_at)
SELECT
  pl.patient_id, pl.protocol_id,
  CASE WHEN pl.log_type = 'drip_email' THEN 'email' ELSE 'sms' END,
  pl.log_type, pl.notes, 'sent',
  CASE
    WHEN pl.log_type = 'drip_email' THEN 'wl-drip-emails'
    WHEN pl.log_type = 'peptide_guide_sent' THEN 'assign'
    WHEN pl.log_type = 'checkin_text_sent' THEN 'send-sms'
    WHEN pl.log_type LIKE 'peptide_%' THEN 'peptide-reminders'
    ELSE 'unknown'
  END,
  COALESCE(pl.created_at, (pl.log_date || 'T12:00:00Z')::timestamptz)
FROM protocol_logs pl
WHERE pl.log_type IN (
  'drip_email', 'peptide_guide_sent', 'checkin_text_sent',
  'peptide_followup', 'peptide_weekly_checkin_1', 'peptide_weekly_checkin_2',
  'peptide_weekly_checkin_3', 'peptide_reup'
);

-- From checkin_reminders_log (WL weekly check-in SMS)
INSERT INTO comms_log (patient_id, protocol_id, ghl_contact_id, patient_name, channel, message_type, message, status, error_message, source, created_at)
SELECT
  cr.patient_id, cr.protocol_id, cr.ghl_contact_id, cr.patient_name,
  'sms', 'wl_weekly_checkin', cr.message_content, cr.status, cr.error_message,
  'weekly-checkin-reminder', cr.sent_at
FROM checkin_reminders_log cr;
