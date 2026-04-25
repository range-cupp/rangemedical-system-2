-- Adds an optional SIG (directions for use) override column to protocols.
-- When NULL, the UI auto-composes the SIG from dose/frequency/route.
-- When set, the override replaces the auto-composed SIG in the medication list.

ALTER TABLE protocols ADD COLUMN IF NOT EXISTS sig text;
COMMENT ON COLUMN protocols.sig IS 'Optional override for the SIG (directions for use) shown in the medication list. When NULL, the UI auto-composes from dose/frequency/route.';
