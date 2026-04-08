-- Migration: Add fields for sequential peptide protocol logic
-- 2026-03-30

-- Add continuous tracking fields to protocols
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS continuous_days_started DATE;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS continuous_days_used INTEGER DEFAULT 0;

-- Add category column to tasks (for filtering peptide tasks, etc.)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT;

-- Create webhook_logs table for audit trail
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_purchase_id ON webhook_logs(purchase_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
