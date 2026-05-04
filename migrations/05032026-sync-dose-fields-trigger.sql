-- Keep `dose` and `current_dose` in sync with `selected_dose` automatically.
-- The codebase has ~30 writers that touch only selected_dose; this trigger
-- guarantees the legacy mirror columns stay current regardless of which
-- code path writes. Prevents the dose drift that masked Kristen Gray's
-- correct 1mg as a stale 2mg in the protocol injection table.
CREATE OR REPLACE FUNCTION sync_protocol_dose_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only mirror when selected_dose was actually set in this write.
  -- (Otherwise an UPDATE that only changes, e.g., last_visit_date would
  --  silently overwrite a legitimately-different dose / current_dose value.)
  IF (TG_OP = 'INSERT' AND NEW.selected_dose IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.selected_dose IS DISTINCT FROM OLD.selected_dose)
  THEN
    NEW.dose := NEW.selected_dose;
    NEW.current_dose := NEW.selected_dose;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protocols_sync_dose_fields ON protocols;
CREATE TRIGGER protocols_sync_dose_fields
  BEFORE INSERT OR UPDATE ON protocols
  FOR EACH ROW
  EXECUTE FUNCTION sync_protocol_dose_fields();
