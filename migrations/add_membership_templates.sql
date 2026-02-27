-- Add membership protocol templates for combo (HBOT+RLT) and individual memberships
-- Run this migration to create the templates in the protocol_templates table

INSERT INTO protocol_templates (name, category, description, is_active, display_order)
VALUES
  ('Combo Membership — 1x/Week', 'combo_membership', '4 HBOT + 4 RLT sessions/month', true, 50),
  ('Combo Membership — 2x/Week', 'combo_membership', '8 HBOT + 8 RLT sessions/month', true, 51),
  ('Combo Membership — 3x/Week', 'combo_membership', '12 HBOT + 12 RLT sessions/month', true, 52),
  ('Hyperbaric Recovery Membership', 'hbot', '4 HBOT sessions per month', true, 53),
  ('Red Light Reset Membership', 'rlt', 'Up to 12 RLT sessions per month', true, 54);
