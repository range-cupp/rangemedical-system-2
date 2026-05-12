-- Add open/click/bounce tracking to email campaign recipients
-- Resend automatically tracks opens (pixel) and clicks (link rewrite);
-- data flows in via /api/webhooks/resend or the manual refresh-stats endpoint.

ALTER TABLE email_campaign_recipients
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ;

ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bounce_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ecr_resend_id ON email_campaign_recipients(resend_email_id);
