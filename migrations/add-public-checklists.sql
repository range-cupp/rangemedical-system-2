-- Shared state table for unlisted public checklists (e.g. /san-clemente-opening)
-- Each row = one checklist, identified by slug. State stored as JSONB blobs.

CREATE TABLE public_checklists (
  slug TEXT PRIMARY KEY,
  checked JSONB NOT NULL DEFAULT '{}',
  custom_items JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public_checklists
  FOR ALL USING (auth.role() = 'service_role');

-- Seed the San Clemente opening checklist with the items currently checked by default.
INSERT INTO public_checklists (slug, checked, custom_items)
VALUES (
  'san-clemente-opening',
  '{"fac-gym":true,"fac-wd":true,"p-reed":true,"p-pt-meetings":true,"p-staff-meetings":true,"p-comp-lola":true,"o-washer":true,"o-dryer":true}'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
