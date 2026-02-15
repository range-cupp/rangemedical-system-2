-- Add cycle_start_date to protocols table for recovery peptide cycle tracking
-- Recovery peptides (BPC-157, BPC-157/TB4, Wolverine Blend, BPC-157/TB-500/KPV/MGF)
-- have a 12-week (84-day) max cycle. Sub-protocols sharing the same cycle_start_date
-- are grouped into one cycle.

ALTER TABLE protocols ADD COLUMN IF NOT EXISTS cycle_start_date DATE;
