-- Set 20-minute buffer between HBOT appointments
-- Allows time for chamber depressurization, sanitization, and patient turnover
UPDATE services
SET buffer_minutes = 20,
    updated_at = now()
WHERE slug = 'hbot';
