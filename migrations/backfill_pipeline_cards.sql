-- Backfill pipeline_cards from existing data sources.
-- Safe to run multiple times — uses ON CONFLICT clauses where possible.
-- Order:
--   1. Leads pipeline  ← sales_pipeline table
--   2. Treatment pipelines ← active protocols (mapped by program_type)
--   3. Energy workup pipeline ← lab_journeys (if present)
--
-- After running, verify counts with:
--   SELECT pipeline, stage, count(*) FROM pipeline_cards GROUP BY pipeline, stage ORDER BY pipeline, stage;

-- ── Leads: sales_pipeline → pipeline_cards(pipeline='leads') ────────────────
-- Stage remap: keep names that already match, translate legacy ones.
INSERT INTO pipeline_cards (
  pipeline, stage, status,
  patient_id, first_name, last_name, email, phone,
  assigned_to, lead_id, source, path, urgency, notes, lost_reason,
  entered_stage_at, last_activity_at, created_at
)
SELECT
  'leads' AS pipeline,
  CASE sp.stage
    WHEN 'new_lead'         THEN 'new'
    WHEN 'contacted'        THEN 'reached_out'
    WHEN 'follow_up'        THEN 'connected'
    WHEN 'intake_completed' THEN 'connected'
    WHEN 'booked'           THEN 'assessment_booked'
    WHEN 'showed'           THEN 'assessment_done'
    WHEN 'started'          THEN 'assessment_done'
    WHEN 'lost'             THEN 'new'
    ELSE 'new'
  END AS stage,
  CASE sp.stage
    WHEN 'lost'    THEN 'lost'
    WHEN 'started' THEN 'completed'
    ELSE 'active'
  END AS status,
  sp.patient_id,
  sp.first_name, sp.last_name, sp.email, sp.phone,
  CASE WHEN sp.assigned_to IS NOT NULL AND sp.assigned_to <> '' THEN ARRAY[sp.assigned_to] ELSE '{}'::text[] END,
  sp.lead_id, sp.source, sp.path, sp.urgency, sp.notes, sp.lost_reason,
  sp.updated_at, sp.updated_at, sp.created_at
FROM sales_pipeline sp
WHERE NOT EXISTS (
  SELECT 1 FROM pipeline_cards pc
  WHERE pc.pipeline = 'leads'
    AND ((pc.patient_id IS NOT NULL AND pc.patient_id = sp.patient_id)
         OR (pc.phone IS NOT NULL AND pc.phone = sp.phone))
);

-- ── Treatments: active protocols → pipeline_cards ──────────────────────────
-- HRT
INSERT INTO pipeline_cards (
  pipeline, stage, status, patient_id, protocol_id,
  meta, entered_stage_at, last_activity_at, created_at
)
SELECT 'hrt',
       CASE WHEN pr.created_at > now() - interval '14 days' THEN 'started' ELSE 'active' END,
       'active',
       pr.patient_id, pr.id,
       jsonb_strip_nulls(jsonb_build_object(
         'medication', pr.medication,
         'dose', COALESCE(pr.selected_dose, pr.starting_dose),
         'administration_mode',
           CASE WHEN pr.delivery_method = 'take_home' THEN 'take_home' ELSE 'in_clinic' END
       )),
       pr.start_date::timestamptz, pr.updated_at, pr.created_at
FROM protocols pr
WHERE pr.status = 'active'
  AND pr.program_type IN ('hrt')
  AND NOT EXISTS (
    SELECT 1 FROM pipeline_cards pc WHERE pc.protocol_id = pr.id
  );

-- Weight Loss
INSERT INTO pipeline_cards (
  pipeline, stage, status, patient_id, protocol_id,
  meta, entered_stage_at, last_activity_at, created_at
)
SELECT 'weight_loss',
       CASE
         WHEN pr.created_at > now() - interval '7 days'  THEN 'started'
         WHEN pr.created_at > now() - interval '56 days' THEN 'titrating'
         ELSE 'maintenance'
       END,
       'active',
       pr.patient_id, pr.id,
       jsonb_strip_nulls(jsonb_build_object(
         'medication', pr.medication,
         'dose', COALESCE(pr.selected_dose, pr.starting_dose),
         'administration_mode',
           CASE WHEN pr.delivery_method = 'take_home' THEN 'take_home' ELSE 'in_clinic' END
       )),
       pr.start_date::timestamptz, pr.updated_at, pr.created_at
FROM protocols pr
WHERE pr.status = 'active'
  AND pr.program_type = 'weight_loss'
  AND NOT EXISTS (SELECT 1 FROM pipeline_cards pc WHERE pc.protocol_id = pr.id);

-- Peptides
INSERT INTO pipeline_cards (
  pipeline, stage, status, patient_id, protocol_id,
  meta, entered_stage_at, last_activity_at, created_at
)
SELECT 'peptides', 'active_cycle', 'active',
       pr.patient_id, pr.id,
       jsonb_strip_nulls(jsonb_build_object(
         'medication', pr.medication,
         'dose', COALESCE(pr.selected_dose, pr.starting_dose)
       )),
       pr.start_date::timestamptz, pr.updated_at, pr.created_at
FROM protocols pr
WHERE pr.status = 'active'
  AND pr.program_type = 'peptide'
  AND NOT EXISTS (SELECT 1 FROM pipeline_cards pc WHERE pc.protocol_id = pr.id);

-- HBOT
INSERT INTO pipeline_cards (
  pipeline, stage, status, patient_id, protocol_id,
  meta, entered_stage_at, last_activity_at, created_at
)
SELECT 'hbot',
       CASE WHEN pr.sessions_used = 0 THEN 'new_package' ELSE 'in_progress' END,
       'active',
       pr.patient_id, pr.id,
       jsonb_strip_nulls(jsonb_build_object(
         'sessions_used', pr.sessions_used,
         'total_sessions', pr.total_sessions
       )),
       pr.start_date::timestamptz, pr.updated_at, pr.created_at
FROM protocols pr
WHERE pr.status = 'active'
  AND pr.program_type = 'hbot'
  AND NOT EXISTS (SELECT 1 FROM pipeline_cards pc WHERE pc.protocol_id = pr.id);

-- RLT
INSERT INTO pipeline_cards (
  pipeline, stage, status, patient_id, protocol_id,
  meta, entered_stage_at, last_activity_at, created_at
)
SELECT 'rlt',
       CASE WHEN pr.sessions_used = 0 THEN 'new_package' ELSE 'in_progress' END,
       'active',
       pr.patient_id, pr.id,
       jsonb_strip_nulls(jsonb_build_object(
         'sessions_used', pr.sessions_used,
         'total_sessions', pr.total_sessions
       )),
       pr.start_date::timestamptz, pr.updated_at, pr.created_at
FROM protocols pr
WHERE pr.status = 'active'
  AND pr.program_type = 'rlt'
  AND NOT EXISTS (SELECT 1 FROM pipeline_cards pc WHERE pc.protocol_id = pr.id);

-- Injections (PRP + Exosome)
INSERT INTO pipeline_cards (
  pipeline, stage, status, patient_id, protocol_id,
  meta, entered_stage_at, last_activity_at, created_at
)
SELECT 'injections', 'treated', 'active',
       pr.patient_id, pr.id,
       jsonb_strip_nulls(jsonb_build_object(
         'injection_type', CASE
           WHEN pr.medication ILIKE '%exosome%' THEN 'exosomes'
           ELSE 'prp'
         END
       )),
       pr.start_date::timestamptz, pr.updated_at, pr.created_at
FROM protocols pr
WHERE pr.status = 'active'
  AND pr.program_type = 'injection'
  AND NOT EXISTS (SELECT 1 FROM pipeline_cards pc WHERE pc.protocol_id = pr.id);

-- ── Energy Workup: lab_journeys → pipeline_cards ────────────────────────────
-- Only run if lab_journeys table exists. Stage remap follows config.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_journeys') THEN
    INSERT INTO pipeline_cards (
      pipeline, stage, status, patient_id,
      first_name, last_name, email, phone,
      entered_stage_at, last_activity_at, created_at
    )
    SELECT 'energy_workup',
      CASE lj.stage
        WHEN 'draw_scheduled'     THEN 'labs_scheduled'
        WHEN 'draw_complete'      THEN 'awaiting_results'
        WHEN 'provider_reviewed'  THEN 'ready_to_schedule'
        WHEN 'consult_scheduled'  THEN 'consult_booked'
        WHEN 'need_follow_up'     THEN 'scheduling_attempted'
        WHEN 'treatment_started'  THEN 'consult_completed'
        ELSE 'labs_scheduled'
      END,
      CASE WHEN lj.stage = 'treatment_started' THEN 'completed' ELSE 'active' END,
      lj.patient_id,
      split_part(coalesce(lj.patient_name,''), ' ', 1),
      nullif(regexp_replace(coalesce(lj.patient_name,''), '^\S+\s*', ''), ''),
      lj.patient_email, lj.patient_phone,
      lj.updated_at, lj.updated_at, lj.created_at
    FROM lab_journeys lj
    WHERE NOT EXISTS (
      SELECT 1 FROM pipeline_cards pc
      WHERE pc.pipeline = 'energy_workup'
        AND pc.patient_id IS NOT NULL
        AND pc.patient_id = lj.patient_id
    );
  END IF;
END $$;

-- Verify
SELECT pipeline, stage, count(*) AS n
FROM pipeline_cards
GROUP BY pipeline, stage
ORDER BY pipeline, stage;
