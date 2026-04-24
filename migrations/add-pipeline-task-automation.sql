-- Pipeline ↔ Task automation
-- Range Medical — Labs pipeline automation
--
-- Adds three columns to `tasks`:
--   • pipeline_card_id      — task is linked to a pipeline card
--   • on_complete_move_to   — when completed, advance the linked card to this stage
--   • additional_assignees  — joint-owned tasks (e.g., Damien + Evan on lab review)

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS pipeline_card_id UUID REFERENCES pipeline_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS on_complete_move_to TEXT,
  ADD COLUMN IF NOT EXISTS additional_assignees UUID[] DEFAULT ARRAY[]::UUID[];

CREATE INDEX IF NOT EXISTS idx_tasks_pipeline_card_id ON tasks(pipeline_card_id);
CREATE INDEX IF NOT EXISTS idx_tasks_additional_assignees ON tasks USING GIN (additional_assignees);
