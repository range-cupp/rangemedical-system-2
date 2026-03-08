-- Pending Link Messages — Blooio two-step opt-in queue
-- Range Medical
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pending_link_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  phone TEXT NOT NULL,                          -- E.164 format
  message TEXT NOT NULL,                        -- Full message with links to send later
  message_type TEXT,                            -- 'form_links', 'guide_links'
  form_bundle_id UUID,                          -- Links to form_bundles if applicable
  status TEXT NOT NULL DEFAULT 'pending',        -- 'pending' | 'sent' | 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,                          -- When auto-sent after patient reply
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Fast lookup for pending messages by phone (used in webhook auto-send)
CREATE INDEX IF NOT EXISTS idx_pending_link_messages_phone_pending
  ON pending_link_messages(phone)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pending_link_messages_status
  ON pending_link_messages(status);
