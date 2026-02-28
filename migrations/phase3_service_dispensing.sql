-- Phase 3: Service Logging & Dispensing Enhancements
-- Range Medical System V2
-- Run this migration against your Supabase database

-- Add dispensing/signature fields to service_logs
ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS administered_by TEXT;
ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS lot_number TEXT;
ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS expiration_date DATE;
ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS sign_out_pdf_url TEXT;
