-- Add HBOT trial support to trial_passes and trial_surveys
-- trial_type distinguishes RLT ($49) vs HBOT ($149) trials
-- headaches + mood are HBOT-specific survey scales

-- trial_passes: add trial_type column
ALTER TABLE trial_passes
  ADD COLUMN IF NOT EXISTS trial_type TEXT DEFAULT 'rlt';

COMMENT ON COLUMN trial_passes.trial_type IS 'Trial type: rlt (3 RLT sessions / 7 days / $49) or hbot (3 HBOT sessions / 10 days / $149)';

-- trial_surveys: add HBOT-specific scales
ALTER TABLE trial_surveys
  ADD COLUMN IF NOT EXISTS headaches INTEGER,
  ADD COLUMN IF NOT EXISTS mood INTEGER;

COMMENT ON COLUMN trial_surveys.headaches IS 'HBOT trial scale: 0 = no headaches, 10 = severe/daily';
COMMENT ON COLUMN trial_surveys.mood IS 'HBOT trial scale: 0 = very low mood, 10 = great mood';
