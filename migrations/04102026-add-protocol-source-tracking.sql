-- Migration: Add source tracking to protocols
-- Applied: 2026-04-10
-- Purpose: Track where every protocol was created from and by whom
-- Part of the createProtocol() centralization effort

-- Track creation source (e.g. 'auto-protocol', 'admin-protocols', 'dose-change')
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS source TEXT;

-- Track who created it (employee UUID or 'system')
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';

-- Update status CHECK to include 'historic' (dose change) and 'exchanged'
ALTER TABLE protocols DROP CONSTRAINT IF EXISTS chk_protocols_status;
ALTER TABLE protocols ADD CONSTRAINT chk_protocols_status CHECK (
  status IN (
    'active', 'completed', 'paused', 'cancelled',
    'merged', 'in_treatment', 'queued',
    'draw_scheduled', 'uploaded', 'ready_to_schedule',
    'follow_up', 'consult_scheduled', 'awaiting_results',
    'historic', 'exchanged'
  )
);
