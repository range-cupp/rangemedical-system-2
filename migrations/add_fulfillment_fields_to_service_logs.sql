-- Add fulfillment method and tracking number to service_logs
-- For medication pickups: in_clinic or overnight shipping with tracking
ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS fulfillment_method TEXT; -- 'in_clinic' or 'overnight'
ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS tracking_number TEXT;
