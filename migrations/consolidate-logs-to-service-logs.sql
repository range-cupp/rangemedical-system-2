-- Migration: Consolidate protocol_logs and weight_logs activity data into service_logs
-- Range Medical — 2026-03-17
--
-- This migrates activity entries from protocol_logs and weight_logs into service_logs
-- so that service_logs becomes the single source of truth for all patient activity.
-- System/audit entries (drip_email, blood_draw, peptide_guide_sent, renewal) stay in protocol_logs.
--
-- This is ADDITIVE ONLY — no deletes, no data loss.

-- ============================================
-- Step 1: Port protocol_logs activity entries
-- ============================================
-- Only insert rows that don't already have a matching service_logs entry
-- (same protocol_id + entry_date within same day)

INSERT INTO service_logs (
  patient_id,
  protocol_id,
  category,
  entry_type,
  entry_date,
  weight,
  medication,
  dosage,
  notes,
  created_at
)
SELECT
  COALESCE(pl.patient_id, p.patient_id),
  pl.protocol_id,
  -- Derive category from protocol's program_type
  CASE
    WHEN p.program_type ILIKE 'weight_loss%' THEN 'weight_loss'
    WHEN p.program_type = 'hrt' OR p.program_type ILIKE '%hrt%' THEN 'testosterone'
    WHEN p.program_type = 'peptide' THEN 'peptide'
    WHEN p.program_type ILIKE '%iv%' THEN 'iv_therapy'
    WHEN p.program_type ILIKE '%hbot%' THEN 'hbot'
    WHEN p.program_type ILIKE '%red_light%' THEN 'red_light'
    ELSE 'weight_loss'
  END AS category,
  -- Map log_type to entry_type
  CASE
    WHEN pl.log_type IN ('checkin', 'weigh_in') THEN 'weight_check'
    WHEN pl.log_type = 'injection' THEN 'injection'
    WHEN pl.log_type = 'session' THEN 'session'
    WHEN pl.log_type = 'missed' THEN 'missed'
    WHEN pl.log_type = 'peptide_checkin' THEN 'checkin'
    WHEN pl.log_type = 'refill' THEN 'pickup'
    ELSE 'injection'
  END AS entry_type,
  pl.log_date AS entry_date,
  pl.weight,
  p.medication,
  p.selected_dose AS dosage,
  pl.notes,
  pl.created_at
FROM protocol_logs pl
JOIN protocols p ON p.id = pl.protocol_id
WHERE pl.log_type IN ('checkin', 'injection', 'weigh_in', 'session', 'missed', 'peptide_checkin', 'refill')
  AND NOT EXISTS (
    SELECT 1 FROM service_logs sl
    WHERE sl.protocol_id = pl.protocol_id
      AND sl.entry_date = pl.log_date
      AND sl.patient_id = pl.patient_id
  );

-- ============================================
-- Step 2: Port weight_logs entries
-- ============================================
-- These are patient-portal self-reported weights

INSERT INTO service_logs (
  patient_id,
  protocol_id,
  category,
  entry_type,
  entry_date,
  weight,
  medication,
  notes,
  created_at
)
SELECT
  p.patient_id,
  wl.protocol_id,
  'weight_loss' AS category,
  'weight_check' AS entry_type,
  wl.log_date AS entry_date,
  wl.weight,
  p.medication,
  wl.notes,
  wl.created_at
FROM weight_logs wl
JOIN protocols p ON p.id = wl.protocol_id
WHERE NOT EXISTS (
  SELECT 1 FROM service_logs sl
  WHERE sl.protocol_id = wl.protocol_id
    AND sl.entry_date = wl.log_date
    AND sl.patient_id = p.patient_id
);
