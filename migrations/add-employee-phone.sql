-- Migration: Add phone column to employees table
-- Enables SMS notifications to providers/staff when appointments are booked
-- Range Medical System
-- Created: 2026-03-17

ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;

-- Index for phone lookup
CREATE INDEX IF NOT EXISTS idx_employees_phone ON employees(phone) WHERE phone IS NOT NULL;
