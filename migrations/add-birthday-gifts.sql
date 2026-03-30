-- Birthday Gifts table
-- Tracks free injection gifts sent to patients on their birthday month
-- Each token is valid for the patient's birthday month only

CREATE TABLE IF NOT EXISTS birthday_gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  token TEXT NOT NULL UNIQUE,
  birth_month INT NOT NULL,         -- 1-12, the month this gift is valid for
  birth_year INT NOT NULL,          -- year issued (so we can re-issue next year)
  injection_type TEXT,              -- 'range-injections' or 'nad-injection' (set when patient picks)
  calcom_booking_uid TEXT,          -- set when booking is created
  status TEXT NOT NULL DEFAULT 'active',  -- active, booked, redeemed, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  booked_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL   -- last day of birth month
);

-- Index for token lookup (landing page)
CREATE INDEX IF NOT EXISTS idx_birthday_gifts_token ON birthday_gifts(token);

-- Index for dedup: one gift per patient per year
CREATE UNIQUE INDEX IF NOT EXISTS idx_birthday_gifts_patient_year ON birthday_gifts(patient_id, birth_year);

-- RLS
ALTER TABLE birthday_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON birthday_gifts
  FOR ALL USING (true) WITH CHECK (true);
