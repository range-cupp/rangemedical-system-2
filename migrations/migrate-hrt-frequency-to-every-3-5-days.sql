-- Migrate existing HRT (testosterone) protocols from "2x per week" / "2x_weekly"
-- to the new source-of-truth value "every_3_5_days".
--
-- Same clinical schedule (2 doses per 7-day week = every 3.5 days), just standardized wording.
-- SubQ daily testosterone protocols (frequency in 'daily', 'Daily', '2x daily') are left untouched.

UPDATE protocols
SET frequency = 'every_3_5_days'
WHERE program_type = 'hrt'
  AND frequency IN ('2x per week', '2x_weekly', '2x weekly', 'twice weekly', '2x/week');
