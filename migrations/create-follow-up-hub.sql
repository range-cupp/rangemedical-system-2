-- Follow-Up Hub Tables
-- Range Medical - 2026-04-15
--
-- Two tables:
-- 1. follow_ups: Auto-generated and manual follow-up items for patient outreach
-- 2. follow_up_log: Multi-attempt tracking per follow-up (called, left VM, etc.)

-- ============================================
-- follow_ups — main follow-up queue
-- ============================================
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  patient_name TEXT,
  protocol_id UUID REFERENCES protocols(id),

  -- What triggered this follow-up
  type TEXT NOT NULL,
    -- peptide_renewal, protocol_ending, wl_payment_due, labs_ready,
    -- session_verification, lead_stale, inactive_patient, custom
  trigger_reason TEXT,

  -- Tracking
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending, in_progress, completed, snoozed, dismissed
  priority TEXT NOT NULL DEFAULT 'medium',
    -- urgent, high, medium, low
  assigned_to UUID,
  due_date DATE,

  -- Resolution
  outcome TEXT,
    -- scheduled, renewed, not_interested, no_answer, completed, dismissed
  outcome_notes TEXT,
  snoozed_until DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_follow_ups_status_due ON follow_ups(status, due_date);
CREATE INDEX idx_follow_ups_patient ON follow_ups(patient_id);
CREATE INDEX idx_follow_ups_type ON follow_ups(type);
CREATE INDEX idx_follow_ups_assigned ON follow_ups(assigned_to, status);
CREATE INDEX idx_follow_ups_created ON follow_ups(created_at DESC);

-- ============================================
-- follow_up_log — attempt tracking per follow-up
-- ============================================
CREATE TABLE IF NOT EXISTS follow_up_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_id UUID NOT NULL REFERENCES follow_ups(id) ON DELETE CASCADE,

  action TEXT NOT NULL,
    -- called, texted, emailed, left_vm, no_answer, spoke_with_patient, scheduled, renewed
  notes TEXT,
  logged_by UUID,
  logged_by_name TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_follow_up_log_follow_up ON follow_up_log(follow_up_id);
CREATE INDEX idx_follow_up_log_created ON follow_up_log(created_at DESC);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON follow_ups
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON follow_up_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON follow_ups TO service_role;
GRANT ALL ON follow_up_log TO service_role;
