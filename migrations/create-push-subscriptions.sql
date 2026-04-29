-- Web Push subscriptions for the team chat PWA
-- One employee can have multiple subscriptions (one per device/browser they install on).

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  failure_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_employee ON push_subscriptions(employee_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on push_subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.role() = 'service_role');
