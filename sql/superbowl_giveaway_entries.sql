-- Super Bowl LX Giveaway Entries Table
-- Range Medical - 2026-02-08
--
-- Run this in Supabase SQL Editor to create the table

-- Create the table
CREATE TABLE IF NOT EXISTS superbowl_giveaway_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  team_pick TEXT NOT NULL CHECK (team_pick IN ('patriots', 'seahawks')),
  health_interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_winner BOOLEAN DEFAULT FALSE,
  winner_notified BOOLEAN DEFAULT FALSE,
  winner_selected_at TIMESTAMPTZ,
  utm_source TEXT DEFAULT 'instagram',
  ghl_contact_id TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_superbowl_team_pick ON superbowl_giveaway_entries(team_pick);
CREATE INDEX IF NOT EXISTS idx_superbowl_phone ON superbowl_giveaway_entries(phone_number);
CREATE INDEX IF NOT EXISTS idx_superbowl_winner ON superbowl_giveaway_entries(is_winner);

-- Row Level Security
ALTER TABLE superbowl_giveaway_entries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for public form submission)
CREATE POLICY "Allow anonymous insert" ON superbowl_giveaway_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role can read/update (for admin operations)
CREATE POLICY "Service role full access" ON superbowl_giveaway_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT INSERT ON superbowl_giveaway_entries TO anon;
GRANT ALL ON superbowl_giveaway_entries TO service_role;

-- Comments
COMMENT ON TABLE superbowl_giveaway_entries IS 'Super Bowl LX Giveaway entries - Feb 2026';
COMMENT ON COLUMN superbowl_giveaway_entries.team_pick IS 'patriots or seahawks';
COMMENT ON COLUMN superbowl_giveaway_entries.health_interests IS 'Array of health goals for remarketing';
