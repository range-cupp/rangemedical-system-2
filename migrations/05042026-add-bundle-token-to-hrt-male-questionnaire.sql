-- HRT Male Questionnaire — track which form bundle a submission came from
-- so /api/form-bundles/[token] can detect completion when the questionnaire
-- is sent as part of a form bundle.

ALTER TABLE hrt_male_questionnaire_responses
  ADD COLUMN IF NOT EXISTS bundle_token TEXT;

CREATE INDEX IF NOT EXISTS idx_hrt_male_questionnaire_bundle_token
  ON hrt_male_questionnaire_responses (bundle_token);
