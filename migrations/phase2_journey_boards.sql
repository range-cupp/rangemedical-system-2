-- Phase 2: Journey Boards & Protocol Tracking
-- Range Medical System V2
-- Run this migration against your Supabase database

-- Journey Templates: defines the stages for each protocol type
CREATE TABLE IF NOT EXISTS journey_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_type TEXT NOT NULL,              -- hrt, weight_loss, peptide, iv, hbot, rlt, injection, combo_membership
  name TEXT NOT NULL,                       -- e.g. "HRT Journey", "Weight Loss Journey"
  stages JSONB NOT NULL DEFAULT '[]',       -- [{key, label, description, order, auto_conditions}]
  is_default BOOLEAN DEFAULT false,         -- one default template per protocol_type
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: only one default per protocol_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_journey_templates_default
  ON journey_templates (protocol_type) WHERE is_default = true;

-- Journey Events: tracks stage transitions for audit trail
CREATE TABLE IF NOT EXISTS journey_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  protocol_id UUID NOT NULL REFERENCES protocols(id),
  current_stage TEXT NOT NULL,
  previous_stage TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual',  -- manual, auto, system
  triggered_by TEXT,                             -- staff name or 'system'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_events_protocol ON journey_events(protocol_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_patient ON journey_events(patient_id);

-- Add journey tracking columns to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS current_journey_stage TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS journey_template_id UUID REFERENCES journey_templates(id);

-- Index for efficient board queries
CREATE INDEX IF NOT EXISTS idx_protocols_journey_stage ON protocols(current_journey_stage) WHERE current_journey_stage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_protocols_program_type ON protocols(program_type);
