-- Migration: Clean up standalone Range IV protocols
-- These are no longer needed — Range IV perk is now tracked directly
-- within the HRT protocol via service_logs.
--
-- This sets all Range IV protocols (created by add-hrt-ivs.js) to 'completed'
-- so they no longer appear in active protocol lists.
-- Run date: 2026-03-20

-- Archive all active Range IV protocols that were HRT membership perks
UPDATE protocols
SET status = 'completed',
    notes = COALESCE(notes, '') || ' [Archived: Range IV now tracked within HRT protocol]',
    updated_at = NOW()
WHERE program_type = 'iv'
  AND medication = 'Range IV'
  AND status = 'active';

-- Also mark any pending ones
UPDATE protocols
SET status = 'completed',
    notes = COALESCE(notes, '') || ' [Archived: Range IV now tracked within HRT protocol]',
    updated_at = NOW()
WHERE program_type = 'iv'
  AND medication = 'Range IV'
  AND status = 'pending';
