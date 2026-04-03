-- Add dose_history JSONB column to protocols table
-- Tracks HRT dose changes over time as an array of { date, dose, injections_per_week, notes }
-- Example: [{"date":"2025-10-01","dose":"0.3ml/60mg","injections_per_week":2,"notes":"Starting dose"},
--           {"date":"2026-03-01","dose":"0.2ml/40mg","injections_per_week":2,"notes":"Reduced after labs"}]

ALTER TABLE protocols
ADD COLUMN IF NOT EXISTS dose_history JSONB DEFAULT '[]'::jsonb;

-- Seed dose_history for existing active HRT protocols that have a selected_dose and start_date
-- This creates the initial entry so the timeline has a starting point
UPDATE protocols
SET dose_history = jsonb_build_array(
  jsonb_build_object(
    'date', start_date::text,
    'dose', selected_dose,
    'injections_per_week', COALESCE(injections_per_week, 2),
    'notes', 'Starting dose'
  )
)
WHERE program_type ILIKE '%hrt%'
  AND selected_dose IS NOT NULL
  AND start_date IS NOT NULL
  AND (dose_history IS NULL OR dose_history = '[]'::jsonb);
