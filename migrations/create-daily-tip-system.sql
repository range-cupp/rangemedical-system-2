-- Daily Action Tip Email System
-- Subscribers, tip queue, send log, and unsubscribe suppression

-- ============================================================
-- daily_subscribers — email list members
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL DEFAULT 'landing_page',  -- landing_page, manychat, manual, import
  status TEXT NOT NULL DEFAULT 'active',        -- active, unsubscribed, bounced, complained
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  welcome_sequence_started_at TIMESTAMPTZ,
  welcome_sequence_completed BOOLEAN NOT NULL DEFAULT false,
  last_sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE daily_subscribers
  ADD CONSTRAINT daily_subscribers_source_check
  CHECK (source IN ('landing_page', 'manychat', 'manual', 'import'));

ALTER TABLE daily_subscribers
  ADD CONSTRAINT daily_subscribers_status_check
  CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained'));

CREATE INDEX IF NOT EXISTS idx_daily_subscribers_email ON daily_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_daily_subscribers_status ON daily_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_daily_subscribers_welcome ON daily_subscribers(welcome_sequence_started_at)
  WHERE welcome_sequence_completed = false;

-- ============================================================
-- daily_tips — the content queue
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, approved, scheduled, sent, archived
  topic_tags TEXT[] DEFAULT '{}',
  scheduled_for DATE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'chris',
  notes TEXT
);

ALTER TABLE daily_tips
  ADD CONSTRAINT daily_tips_status_check
  CHECK (status IN ('draft', 'approved', 'scheduled', 'sent', 'archived'));

CREATE INDEX IF NOT EXISTS idx_daily_tips_scheduled_for ON daily_tips(scheduled_for)
  WHERE status = 'scheduled' OR status = 'approved';
CREATE INDEX IF NOT EXISTS idx_daily_tips_status ON daily_tips(status);

-- ============================================================
-- daily_sends — log of every email sent
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES daily_subscribers(id) ON DELETE CASCADE,
  tip_id UUID REFERENCES daily_tips(id) ON DELETE SET NULL,
  welcome_sequence_step INTEGER,  -- 1, 2, or 3 (null for daily tips)
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  resend_message_id TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced BOOLEAN NOT NULL DEFAULT false,
  complained BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE daily_sends
  ADD CONSTRAINT daily_sends_welcome_step_check
  CHECK (welcome_sequence_step IS NULL OR welcome_sequence_step IN (1, 2, 3));

CREATE INDEX IF NOT EXISTS idx_daily_sends_subscriber ON daily_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_daily_sends_tip ON daily_sends(tip_id);
CREATE INDEX IF NOT EXISTS idx_daily_sends_sent_at ON daily_sends(sent_at);

-- ============================================================
-- daily_unsubscribes — permanent suppression list
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_unsubscribes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_daily_unsubscribes_email ON daily_unsubscribes(email);

-- ============================================================
-- Row Level Security
-- ============================================================

-- daily_subscribers: public can INSERT only (landing page signups)
ALTER TABLE daily_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON daily_subscribers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can subscribe" ON daily_subscribers
  FOR INSERT WITH CHECK (true);

-- daily_tips: service role only
ALTER TABLE daily_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON daily_tips
  FOR ALL USING (auth.role() = 'service_role');

-- daily_sends: service role only
ALTER TABLE daily_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON daily_sends
  FOR ALL USING (auth.role() = 'service_role');

-- daily_unsubscribes: service role only
ALTER TABLE daily_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON daily_unsubscribes
  FOR ALL USING (auth.role() = 'service_role');
