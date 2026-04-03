-- Add metadata JSONB column to comms_log
-- Stores structured context like invoice_id, form_id, etc.
-- Run in Supabase SQL Editor

ALTER TABLE comms_log ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
