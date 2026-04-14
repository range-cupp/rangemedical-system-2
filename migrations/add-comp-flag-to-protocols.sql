-- Migration: Add comp flag to protocols
-- When true, protocol is fully comped — skip payment tracking in Actions board
-- Applied: 2026-04-14

ALTER TABLE protocols
ADD COLUMN IF NOT EXISTS comp BOOLEAN DEFAULT false;

COMMENT ON COLUMN protocols.comp IS 'When true, patient is fully comped — skip payment tracking in Actions board';
