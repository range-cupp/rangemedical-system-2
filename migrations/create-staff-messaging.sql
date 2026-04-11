-- Staff Messaging System
-- Internal Slack-like messaging for Range Medical staff
-- Tables: staff_channels, staff_channel_members, staff_messages

-- Channels (DMs and group chats)
CREATE TABLE IF NOT EXISTS staff_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,                              -- NULL for DMs, user-set for groups
  type TEXT NOT NULL DEFAULT 'dm',        -- 'dm' or 'group'
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_channels_type ON staff_channels(type);

-- Channel membership + read receipts
CREATE TABLE IF NOT EXISTS staff_channel_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES staff_channels(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  muted BOOLEAN DEFAULT FALSE,
  UNIQUE(channel_id, employee_id)
);

CREATE INDEX idx_staff_channel_members_employee ON staff_channel_members(employee_id);
CREATE INDEX idx_staff_channel_members_channel ON staff_channel_members(channel_id);

-- Messages
CREATE TABLE IF NOT EXISTS staff_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES staff_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES employees(id),
  content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_staff_messages_channel_created ON staff_messages(channel_id, created_at DESC);
CREATE INDEX idx_staff_messages_sender ON staff_messages(sender_id);

-- Enable RLS
ALTER TABLE staff_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on staff_channels"
  ON staff_channels FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on staff_channel_members"
  ON staff_channel_members FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on staff_messages"
  ON staff_messages FOR ALL
  USING (auth.role() = 'service_role');

-- Enable Realtime on staff_messages for instant delivery
ALTER PUBLICATION supabase_realtime ADD TABLE staff_messages;

-- Auto-update updated_at on staff_channels
CREATE OR REPLACE FUNCTION update_staff_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER staff_channels_updated_at
  BEFORE UPDATE ON staff_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_channels_updated_at();
