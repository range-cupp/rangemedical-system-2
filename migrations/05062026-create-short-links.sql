-- Short link redirect table
-- Used to send patients short URLs (e.g., /api/r/abc12345) that resolve to
-- long Supabase signed URLs or any arbitrary target. For storage objects we
-- store the bucket + path so the redirect endpoint can mint a fresh signed
-- URL on each click — the link never expires from a stale signature.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) UNIQUE NOT NULL,

  -- For Supabase storage objects (refresh signed URL on each click):
  storage_bucket TEXT,
  storage_path TEXT,

  -- For arbitrary URLs (no refresh needed):
  target_url TEXT,

  -- Metadata:
  description TEXT,
  patient_id UUID,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,

  CHECK (
    (storage_bucket IS NOT NULL AND storage_path IS NOT NULL)
    OR target_url IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(code);
CREATE INDEX IF NOT EXISTS idx_short_links_patient_id ON short_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON short_links(created_at DESC);
