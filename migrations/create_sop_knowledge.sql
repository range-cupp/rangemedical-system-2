-- SOP & Knowledge Base Table
-- Range Medical — 2026-03-15
--
-- Stores SOPs, pre/post service instructions, clinical protocols,
-- FAQs, and any other knowledge the staff bot should know.
-- All active entries are injected into the bot's system prompt at session start.

CREATE TABLE IF NOT EXISTS sop_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Category for grouping in the bot prompt and the admin UI
  -- Values: pre_service, post_service, clinical, admin, faq, protocol, general
  category TEXT NOT NULL DEFAULT 'general',

  -- Short display title (shown in admin UI and as section header in prompt)
  title TEXT NOT NULL,

  -- Full content — can be multi-line, markdown-style bullets are fine
  content TEXT NOT NULL,

  -- Optional comma-separated tags for future search/filtering
  tags TEXT,

  -- Whether this entry is injected into the bot. Toggle off to hide without deleting.
  active BOOLEAN NOT NULL DEFAULT true,

  -- Controls ordering within a category
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sop_knowledge_category ON sop_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_sop_knowledge_active   ON sop_knowledge(active);

-- RLS
ALTER TABLE sop_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON sop_knowledge
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT ALL ON sop_knowledge TO service_role;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_sop_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sop_knowledge_updated_at ON sop_knowledge;
CREATE TRIGGER sop_knowledge_updated_at
  BEFORE UPDATE ON sop_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_sop_knowledge_updated_at();
