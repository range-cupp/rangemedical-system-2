-- Trial Surveys table
-- Pre and post survey for RLT trial pass holders
-- Captures energy, brain fog, recovery, sleep, stress on 0-10 scale
-- Range Medical

CREATE TABLE IF NOT EXISTS trial_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_pass_id UUID NOT NULL REFERENCES trial_passes(id),
  survey_type TEXT NOT NULL,                 -- 'pre' or 'post'

  -- 0-10 scales
  energy INTEGER,
  brain_fog INTEGER,
  recovery INTEGER,
  sleep INTEGER,
  stress INTEGER,

  -- Pre-survey extras
  labs_past_12mo BOOLEAN,
  want_fix_90d BOOLEAN,

  -- Post-survey extras
  noticed_notes TEXT,                        -- "What, if anything, did you notice this week?"

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_surveys_pass ON trial_surveys(trial_pass_id);
CREATE INDEX IF NOT EXISTS idx_trial_surveys_type ON trial_surveys(survey_type);

ALTER TABLE trial_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON trial_surveys FOR ALL USING (true) WITH CHECK (true);
