-- Review Gifts table
-- Tracks free injection gifts sent to patients in exchange for an honest Google review
-- Each patient can only receive one review gift

CREATE TABLE IF NOT EXISTS review_gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  token TEXT NOT NULL UNIQUE,
  injection_type TEXT,              -- 'range-injections' or 'nad-injection' (set when patient picks)
  calcom_booking_uid TEXT,          -- set when booking is created
  status TEXT NOT NULL DEFAULT 'active',  -- active, booked, redeemed, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  booked_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL   -- 30 days from creation
);

-- Index for token lookup (landing page)
CREATE INDEX IF NOT EXISTS idx_review_gifts_token ON review_gifts(token);

-- One review gift per patient
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_gifts_patient ON review_gifts(patient_id);

-- RLS
ALTER TABLE review_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON review_gifts
  FOR ALL USING (true) WITH CHECK (true);
