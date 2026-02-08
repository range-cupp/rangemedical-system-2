-- Super Bowl LX Giveaway Settings Table
-- Range Medical - 2026-02-08

CREATE TABLE IF NOT EXISTS superbowl_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE superbowl_settings ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role full access" ON superbowl_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anonymous read (for checking if contest is open)
CREATE POLICY "Allow anonymous read" ON superbowl_settings
  FOR SELECT
  TO anon
  USING (true);

-- Grant permissions
GRANT SELECT ON superbowl_settings TO anon;
GRANT ALL ON superbowl_settings TO service_role;

-- Insert default row (contest open)
INSERT INTO superbowl_settings (contest_open) VALUES (true);
