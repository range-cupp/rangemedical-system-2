-- Lab Pipeline V2: Redesigned stages with clear staff ownership
-- Old stages: blood_draw_complete, results_received, provider_reviewed, consult_scheduled, treatment_started
-- New stages: awaiting_results, uploaded, under_review, ready_to_schedule, consult_scheduled, in_treatment
--
-- Stage ownership:
--   awaiting_results    → Waiting on Primex
--   uploaded            → Chris / Evan uploaded results
--   under_review        → Damien / Evan reviewing
--   ready_to_schedule   → Terra scheduling consult
--   consult_scheduled   → Consult booked
--   in_treatment        → Treatment started
--
-- Run this migration to convert existing lab protocols to new stages.

-- Migrate existing protocols
UPDATE protocols SET status = 'awaiting_results'    WHERE program_type = 'labs' AND status = 'blood_draw_complete';
UPDATE protocols SET status = 'uploaded'             WHERE program_type = 'labs' AND status = 'results_received';
UPDATE protocols SET status = 'ready_to_schedule'    WHERE program_type = 'labs' AND status = 'provider_reviewed';
-- consult_scheduled stays as-is
UPDATE protocols SET status = 'in_treatment'         WHERE program_type = 'labs' AND status = 'treatment_started';

-- Also handle any consult_complete that may exist
UPDATE protocols SET status = 'in_treatment'         WHERE program_type = 'labs' AND status = 'consult_complete';

-- Update lab_journeys table if it has old stage values
UPDATE lab_journeys SET stage = 'awaiting_results'    WHERE stage = 'draw_complete';
UPDATE lab_journeys SET stage = 'uploaded'             WHERE stage = 'results_received';
UPDATE lab_journeys SET stage = 'ready_to_schedule'    WHERE stage = 'provider_reviewed';
UPDATE lab_journeys SET stage = 'in_treatment'         WHERE stage = 'treatment_started';
UPDATE lab_journeys SET stage = 'consult_scheduled'    WHERE stage = 'consult_scheduled';
