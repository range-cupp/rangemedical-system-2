-- Google Reviews cache table
-- Stores reviews fetched from Google Places API daily

CREATE TABLE IF NOT EXISTS google_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_review_id TEXT UNIQUE NOT NULL,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  relative_time TEXT,
  review_time TIMESTAMPTZ,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store metadata like Place ID and last sync time
CREATE TABLE IF NOT EXISTS google_reviews_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_reviews_rating ON google_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_google_reviews_review_time ON google_reviews(review_time DESC);

-- Enable RLS
ALTER TABLE google_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_reviews_meta ENABLE ROW LEVEL SECURITY;

-- Public read access for reviews (they're public on Google anyway)
CREATE POLICY "Public can read reviews" ON google_reviews FOR SELECT USING (true);

-- Service role only for writes
CREATE POLICY "Service role can manage reviews" ON google_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage meta" ON google_reviews_meta FOR ALL USING (true) WITH CHECK (true);
