-- Migration: Service variants (doses) + compatible add-ons
-- Range Medical
-- Applied: 2026-05-06
--
-- Purpose: Replace the old "one row per dose" pattern (e.g., 'NAD+ IV 250mg',
-- 'NAD+ IV 500mg', ...) with a single specialty service that has dose
-- variants. Also lets a service declare which other services can be tacked on
-- as add-ons during booking (e.g., Methylene Blue IV + Vitamin C add-on).
--
-- Additive only — no existing rows are touched.

-- =============================================================================
-- 1. services: add variants JSON + base price + is_addon flag
-- =============================================================================
-- variants shape (array of objects):
--   [
--     { "value": "500mg", "label": "500mg", "price_cents": 52500, "duration_minutes": 90 },
--     ...
--   ]
-- duration_minutes on a variant is optional — falls back to services.duration_minutes.
-- price_cents on a variant overrides services.price_cents when chosen.
ALTER TABLE services ADD COLUMN IF NOT EXISTS variants    JSONB    NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_cents INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_addon    BOOLEAN  NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_services_addon ON services(is_addon) WHERE is_addon = true;

-- =============================================================================
-- 2. service_addons — which services can be added on to a given parent service
-- Both columns reference services(id). The parent (service_id) is the IV/etc.
-- being booked; the addon (addon_service_id) is a service flagged is_addon=true.
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_addons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id        UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  addon_service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, addon_service_id),
  CHECK (service_id <> addon_service_id)
);

CREATE INDEX IF NOT EXISTS idx_service_addons_service ON service_addons(service_id);
CREATE INDEX IF NOT EXISTS idx_service_addons_addon   ON service_addons(addon_service_id);

ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON service_addons;
CREATE POLICY "service_role_all" ON service_addons FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON service_addons TO service_role;
