-- Pipeline Cards + Pipeline Events
-- One unified pipeline system. Replaces sales_pipeline, lab_journeys,
-- protocols.current_journey_stage, and the lab-stage overloading on protocols.status.
-- Range Medical System V2

CREATE TABLE IF NOT EXISTS pipeline_cards (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id         UUID REFERENCES patients(id) ON DELETE CASCADE,

  pipeline           TEXT NOT NULL,
  -- leads | energy_workup | injury_workup | hrt | weight_loss | peptides | hbot | rlt | injections | follow_up
  stage              TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'active',
  -- active | completed | lost | paused | scheduled

  -- Denormalized contact (leads before they become patients)
  first_name         TEXT,
  last_name          TEXT,
  email              TEXT,
  phone              TEXT,

  -- Multi-staff assignment (array of staff ids from lib/staff.js)
  assigned_to        TEXT[] NOT NULL DEFAULT '{}',

  -- Links
  protocol_id        UUID REFERENCES protocols(id) ON DELETE SET NULL,
  lead_id            UUID,

  -- Lead / entry metadata
  source             TEXT,
  path               TEXT,           -- energy | injury | both
  urgency            INTEGER,

  -- Follow-up pre-creation
  scheduled_for      TIMESTAMPTZ,

  -- Timestamps
  entered_stage_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Free-form
  notes              TEXT,
  lost_reason        TEXT,

  -- Pipeline-specific fields (medication, dose, administration_mode,
  -- sessions_used, injection_type, target, reason, ...)
  meta               JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_pipeline_cards_board        ON pipeline_cards(pipeline, stage) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_patient      ON pipeline_cards(patient_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_scheduled    ON pipeline_cards(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_protocol     ON pipeline_cards(protocol_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_status       ON pipeline_cards(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_phone        ON pipeline_cards(phone);
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_last_activity ON pipeline_cards(last_activity_at DESC);

ALTER TABLE pipeline_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON pipeline_cards;
CREATE POLICY "Service role full access" ON pipeline_cards FOR ALL USING (true) WITH CHECK (true);


-- Audit log: every stage/status/assignment change and any note
CREATE TABLE IF NOT EXISTS pipeline_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id            UUID NOT NULL REFERENCES pipeline_cards(id) ON DELETE CASCADE,

  event_type         TEXT NOT NULL,
  -- stage_change | status_change | assignment_change | note | automation | created

  from_stage         TEXT,
  to_stage           TEXT,
  from_status        TEXT,
  to_status          TEXT,

  triggered_by       TEXT NOT NULL,     -- staff id or 'automation'
  automation_reason  TEXT,              -- e.g. 'lab_pdf_uploaded', 'protocol_created', '70%_elapsed'
  notes              TEXT,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_events_card ON pipeline_events(card_id, created_at DESC);

ALTER TABLE pipeline_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON pipeline_events;
CREATE POLICY "Service role full access" ON pipeline_events FOR ALL USING (true) WITH CHECK (true);


-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION touch_pipeline_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pipeline_cards_updated_at ON pipeline_cards;
CREATE TRIGGER trg_pipeline_cards_updated_at
  BEFORE UPDATE ON pipeline_cards
  FOR EACH ROW EXECUTE FUNCTION touch_pipeline_cards_updated_at();
