-- Complete single IV protocols that shouldn't be active
-- These are one-time IVs (not packs/memberships) that got created as protocols
-- before the auto-protocol guard was added
-- Range Medical - 2026-03-08

UPDATE protocols
SET status = 'completed',
    updated_at = NOW()
WHERE status = 'active'
  AND program_type IN ('iv', 'iv_therapy', 'iv_sessions')
  AND (total_sessions IS NULL OR total_sessions <= 1)
  AND (
    -- Name doesn't include pack or membership (single IVs)
    program_name NOT ILIKE '%pack%'
    AND program_name NOT ILIKE '%membership%'
  );
