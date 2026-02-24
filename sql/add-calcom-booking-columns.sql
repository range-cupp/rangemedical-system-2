-- Add service_details and staff columns to calcom_bookings
-- Run this in Supabase SQL editor

ALTER TABLE calcom_bookings ADD COLUMN IF NOT EXISTS service_details JSONB DEFAULT NULL;
ALTER TABLE calcom_bookings ADD COLUMN IF NOT EXISTS staff_name TEXT DEFAULT NULL;
ALTER TABLE calcom_bookings ADD COLUMN IF NOT EXISTS staff_email TEXT DEFAULT NULL;
