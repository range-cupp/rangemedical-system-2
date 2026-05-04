-- Migration: Native scheduling system (Cal.com replacement, phase 1: schema)
-- Range Medical
-- Applied: 2026-05-03
--
-- Purpose: Create the data model for an internal calendar system that can
-- replace Cal.com. Tables are additive — nothing in `appointments`,
-- `calcom_bookings`, or any other existing table is touched.
--
-- Tables created:
--   1. locations                       — clinic sites (Newport, Placentia, …)
--   2. services                        — bookable services (formerly hardcoded in JS)
--   3. service_providers               — which employees can perform which services
--   4. service_locations               — which locations a service is bookable at
--   5. service_required_forms          — required consent/intake forms per service
--   6. service_prep_instructions       — pre-visit SMS/email per service
--   7. service_automations             — what to do on booking (decrement, log, etc.)
--   8. provider_schedules              — per-employee weekly hours per location
--   9. provider_schedule_overrides     — vacation, day off, special hours

-- =============================================================================
-- Shared updated_at trigger function (idempotent)
-- =============================================================================
CREATE OR REPLACE FUNCTION scheduling_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 1. locations
-- =============================================================================
CREATE TABLE IF NOT EXISTS locations (
  id            TEXT PRIMARY KEY,                        -- 'newport', 'placentia'
  name          TEXT NOT NULL,                           -- 'Range Medical — Newport Beach'
  short_name    TEXT NOT NULL,                           -- 'Newport Beach'
  address       TEXT,
  timezone      TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS locations_updated_at ON locations;
CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION scheduling_set_updated_at();

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON locations;
CREATE POLICY "service_role_all" ON locations FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON locations TO service_role;

-- =============================================================================
-- 2. services — single source of truth for the service catalog
-- =============================================================================
CREATE TABLE IF NOT EXISTS services (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL,
  slug                        TEXT NOT NULL UNIQUE,        -- 'hbot', 'range-iv', etc.
  category                    TEXT NOT NULL,               -- 'hbot', 'iv', 'hrt', etc.
  group_label                 TEXT,                        -- 'Therapies', 'IV Therapy', etc.
  duration_minutes            INTEGER NOT NULL,
  buffer_minutes              INTEGER NOT NULL DEFAULT 0,
  min_notice_hours            INTEGER NOT NULL DEFAULT 0,
  booking_window_days         INTEGER NOT NULL DEFAULT 60,
  description                 TEXT,
  has_modality                BOOLEAN NOT NULL DEFAULT false,
  allowed_modalities          TEXT[],                      -- e.g. {'in_clinic','telemedicine'}
  requires_blood_work         BOOLEAN NOT NULL DEFAULT false,
  blood_work_validity_days    INTEGER,                     -- override default 90
  subtype                     TEXT,                        -- 'range' for Range IV, etc.
  color                       TEXT,                        -- hex for calendar pill
  is_active                   BOOLEAN NOT NULL DEFAULT true,
  is_public_bookable          BOOLEAN NOT NULL DEFAULT false, -- can patients self-book?
  sort_order                  INTEGER NOT NULL DEFAULT 0,
  legacy_calcom_event_type_id INTEGER,                     -- for migration/dedup
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_active        ON services(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_services_category      ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_legacy_calcom ON services(legacy_calcom_event_type_id) WHERE legacy_calcom_event_type_id IS NOT NULL;

DROP TRIGGER IF EXISTS services_updated_at ON services;
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION scheduling_set_updated_at();

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON services;
CREATE POLICY "service_role_all" ON services FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON services TO service_role;

-- =============================================================================
-- 3. service_providers — many-to-many: which employees can perform which services
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    UUID NOT NULL REFERENCES services(id)  ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  display_label TEXT,                                 -- override e.g. "Damien" → "Dr. Burgess"
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_service_providers_service  ON service_providers(service_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_employee ON service_providers(employee_id);

ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON service_providers;
CREATE POLICY "service_role_all" ON service_providers FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON service_providers TO service_role;

-- =============================================================================
-- 4. service_locations — which locations a service is bookable at
-- (Empty rows for a service = bookable at all active locations)
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES services(id)  ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_service_locations_service  ON service_locations(service_id);
CREATE INDEX IF NOT EXISTS idx_service_locations_location ON service_locations(location_id);

ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON service_locations;
CREATE POLICY "service_role_all" ON service_locations FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON service_locations TO service_role;

-- =============================================================================
-- 5. service_required_forms — required consents/intakes per service
-- form_id matches keys in lib/form-bundles.js FORM_DEFINITIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_required_forms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  form_id     TEXT NOT NULL,                         -- 'intake', 'hipaa', 'hrt', etc.
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, form_id)
);

CREATE INDEX IF NOT EXISTS idx_service_required_forms_service ON service_required_forms(service_id);

ALTER TABLE service_required_forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON service_required_forms;
CREATE POLICY "service_role_all" ON service_required_forms FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON service_required_forms TO service_role;

-- =============================================================================
-- 6. service_prep_instructions — pre-visit SMS/email per service
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_prep_instructions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id        UUID NOT NULL UNIQUE REFERENCES services(id) ON DELETE CASCADE,
  sms_body          TEXT,
  email_subject     TEXT,
  email_body        TEXT,
  send_hours_before INTEGER NOT NULL DEFAULT 24,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS service_prep_instructions_updated_at ON service_prep_instructions;
CREATE TRIGGER service_prep_instructions_updated_at
  BEFORE UPDATE ON service_prep_instructions
  FOR EACH ROW EXECUTE FUNCTION scheduling_set_updated_at();

ALTER TABLE service_prep_instructions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON service_prep_instructions;
CREATE POLICY "service_role_all" ON service_prep_instructions FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON service_prep_instructions TO service_role;

-- =============================================================================
-- 7. service_automations — what happens when a service is booked
-- Mirrors CALCOM_APPOINTMENT_ACTIONS in pages/api/webhooks/calcom.js
-- Multiple actions per service allowed (e.g., decrement + log)
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_automations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (action IN ('decrement', 'track_visit', 'lab_journey', 'log', 'none')),
  config      JSONB NOT NULL DEFAULT '{}'::jsonb,    -- e.g. {"protocol_category": "hrt"}
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, action)
);

CREATE INDEX IF NOT EXISTS idx_service_automations_service ON service_automations(service_id);

ALTER TABLE service_automations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON service_automations;
CREATE POLICY "service_role_all" ON service_automations FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON service_automations TO service_role;

-- =============================================================================
-- 8. provider_schedules — weekly recurring hours per employee per location
-- One row per (employee, location, day_of_week, time block).
-- A provider can have multiple blocks per day (e.g., 9–12 + 1–5).
-- effective_from/until allow seasonal or temporary schedules.
-- =============================================================================
CREATE TABLE IF NOT EXISTS provider_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  location_id     TEXT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun, 6=Sat
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  effective_from  DATE,                                  -- NULL = always
  effective_until DATE,                                  -- NULL = always
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_provider_schedules_lookup
  ON provider_schedules(employee_id, location_id, day_of_week)
  WHERE is_active = true;

DROP TRIGGER IF EXISTS provider_schedules_updated_at ON provider_schedules;
CREATE TRIGGER provider_schedules_updated_at
  BEFORE UPDATE ON provider_schedules
  FOR EACH ROW EXECUTE FUNCTION scheduling_set_updated_at();

ALTER TABLE provider_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON provider_schedules;
CREATE POLICY "service_role_all" ON provider_schedules FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON provider_schedules TO service_role;

-- =============================================================================
-- 9. provider_schedule_overrides — vacation, day off, special hours
-- For a given date, this OVERRIDES the recurring weekly schedule.
--   type='blocked'      → provider unavailable (start/end_time ignored)
--   type='custom_hours' → use the custom start/end_time instead of weekly
-- =============================================================================
CREATE TABLE IF NOT EXISTS provider_schedule_overrides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  location_id   TEXT REFERENCES locations(id) ON DELETE RESTRICT,  -- NULL = all locations
  override_date DATE NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('blocked', 'custom_hours')),
  start_time    TIME,                                    -- required if type='custom_hours'
  end_time      TIME,                                    -- required if type='custom_hours'
  reason        TEXT,
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (type = 'blocked' OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time))
);

CREATE INDEX IF NOT EXISTS idx_provider_schedule_overrides_lookup
  ON provider_schedule_overrides(employee_id, override_date);

ALTER TABLE provider_schedule_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON provider_schedule_overrides;
CREATE POLICY "service_role_all" ON provider_schedule_overrides FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON provider_schedule_overrides TO service_role;
