-- Migration: Add browser softphone settings to employees
-- voice_browser_enabled: if true, this employee's browser rings on incoming calls
-- voice_last_registered_at: heartbeat from an active browser softphone session
-- Default is FALSE — staff must opt in explicitly (e.g. provider doesn't want
-- his laptop ringing; front desk does).
-- Range Medical System
-- Created: 2026-04-17

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS voice_browser_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS voice_last_registered_at TIMESTAMPTZ;

-- Index for the inbound TwiML router's presence query:
-- "which employees are opted-in AND currently online (recent heartbeat)?"
CREATE INDEX IF NOT EXISTS idx_employees_voice_online
  ON employees(voice_browser_enabled, voice_last_registered_at)
  WHERE voice_browser_enabled = true AND is_active = true;
