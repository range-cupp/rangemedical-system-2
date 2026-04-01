-- Energy & Recovery Pack
-- Prepaid balance packs: $500 purchase → $750 usable on red light + hyperbaric
-- Base ($500) never expires; Bonus ($250) expires 90 days after purchase

-- Pack ledger
CREATE TABLE IF NOT EXISTS energy_recovery_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  family_member_name TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  amount_paid_cents INTEGER NOT NULL DEFAULT 50000,
  total_value_cents INTEGER NOT NULL DEFAULT 75000,
  base_value_cents INTEGER NOT NULL DEFAULT 50000,
  bonus_value_cents INTEGER NOT NULL DEFAULT 25000,
  remaining_base_cents INTEGER NOT NULL DEFAULT 50000,
  remaining_bonus_cents INTEGER NOT NULL DEFAULT 25000,
  bonus_expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired', 'void')),
  purchase_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_patient_id ON energy_recovery_packs(patient_id);
CREATE INDEX IF NOT EXISTS idx_erp_status ON energy_recovery_packs(status);

-- Redemption log
CREATE TABLE IF NOT EXISTS energy_recovery_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES energy_recovery_packs(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  service_log_id UUID,
  purchase_id UUID,
  service_type TEXT NOT NULL CHECK (service_type IN ('red_light', 'hyperbaric')),
  service_name TEXT,
  amount_cents INTEGER NOT NULL,
  bonus_used_cents INTEGER NOT NULL DEFAULT 0,
  base_used_cents INTEGER NOT NULL DEFAULT 0,
  remaining_after_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_err_pack_id ON energy_recovery_redemptions(pack_id);
CREATE INDEX IF NOT EXISTS idx_err_patient_id ON energy_recovery_redemptions(patient_id);

-- Campaign config (controls visibility + cap)
CREATE TABLE IF NOT EXISTS energy_recovery_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled BOOLEAN NOT NULL DEFAULT true,
  max_packs INTEGER NOT NULL DEFAULT 40,
  price_cents INTEGER NOT NULL DEFAULT 50000,
  value_cents INTEGER NOT NULL DEFAULT 75000,
  bonus_days INTEGER NOT NULL DEFAULT 90,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO energy_recovery_config (enabled, max_packs, price_cents, value_cents, bonus_days)
VALUES (true, 40, 50000, 75000, 90)
ON CONFLICT (id) DO NOTHING;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_energy_recovery_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_energy_recovery_packs_updated_at
  BEFORE UPDATE ON energy_recovery_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_energy_recovery_packs_updated_at();

CREATE OR REPLACE FUNCTION update_energy_recovery_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_energy_recovery_config_updated_at
  BEFORE UPDATE ON energy_recovery_config
  FOR EACH ROW
  EXECUTE FUNCTION update_energy_recovery_config_updated_at();
