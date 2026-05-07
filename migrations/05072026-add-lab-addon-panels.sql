-- Migration: Lab add-on panels (Heavy Metals Blood, Heavy Metals Urine, Mold IgE)
-- Range Medical — 2026-05-07
--
-- Adds three specialty lab panels as bookable add-ons for blood draw appointments.
-- Also adds them to pos_services for POS purchase recording.

-- =============================================================================
-- 1. Add add-on services to the scheduling services table
-- =============================================================================

INSERT INTO services (name, slug, category, group_label, duration_minutes, price_cents, is_addon, is_active, sort_order)
VALUES
  ('Heavy Metals Panel — Blood (3 Toxic)',  'heavy-metals-blood',  'labs', 'Lab Add-Ons', 0, 22000, true, true, 100),
  ('Heavy Metals Panel — Urine (21 Toxic)', 'heavy-metals-urine',  'labs', 'Lab Add-Ons', 0, 28000, true, true, 101),
  ('Mold Profile Plus IgE',                 'mold-profile-ige',    'labs', 'Lab Add-Ons', 0, 20000, true, true, 102)
ON CONFLICT (slug) DO UPDATE SET
  name       = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents,
  is_addon   = EXCLUDED.is_addon,
  is_active  = EXCLUDED.is_active;

-- =============================================================================
-- 2. Link add-ons to blood draw services via service_addons
-- =============================================================================
-- Attach all three add-ons to every active blood-draw service so they appear
-- as optional checkboxes in the booking wizard.

INSERT INTO service_addons (service_id, addon_service_id, sort_order)
SELECT parent.id, addon.id, addon.sort_order
FROM services addon
CROSS JOIN services parent
WHERE addon.slug IN ('heavy-metals-blood', 'heavy-metals-urine', 'mold-profile-ige')
  AND parent.slug LIKE '%blood-draw%'
  AND parent.is_active = true
  AND NOT parent.is_addon
ON CONFLICT (service_id, addon_service_id) DO NOTHING;

-- =============================================================================
-- 3. Add to pos_services for POS purchase recording
-- =============================================================================

INSERT INTO pos_services (name, category, price_cents, recurring, description, sort_order) VALUES
  ('Heavy Metals Panel — Blood (3 Toxic)',  'labs', 22000, false, 'Arsenic, Lead, Mercury — whole blood. Test code L072.', 10),
  ('Heavy Metals Panel — Urine (21 Toxic)', 'labs', 28000, false, '21 toxic metals — urine collection. Avoid seafood 48h prior. Test code 5520.', 11),
  ('Mold Profile Plus IgE',                 'labs', 20000, false, '6 mold allergens (Penicillium, Cladosporium, Aspergillus, Mucor, Alternaria, Stemphylium) — serum. Test code 6327.', 12);
