-- Oxygen 30-day email series subscribers
CREATE TABLE IF NOT EXISTS oxygen_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  current_day INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX idx_oxygen_subscribers_email ON oxygen_subscribers(email);
CREATE INDEX idx_oxygen_subscribers_status ON oxygen_subscribers(status);
