-- Shop Accounts: patient login credentials for the vial shop
CREATE TABLE shop_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shop_accounts_patient_id ON shop_accounts(patient_id);
CREATE INDEX idx_shop_accounts_username ON shop_accounts(username);

-- Shop Orders: itemized order records (purchases table handles financial side)
CREATE TABLE shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  purchase_id UUID REFERENCES purchases(id),
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled

  -- Line items stored as JSONB array
  -- Each item: { peptide_id, name, vial_size, quantity, unit_price_cents, total_cents }
  items JSONB NOT NULL DEFAULT '[]',

  -- Totals
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,

  -- Shipping
  shipping_method TEXT, -- 'pickup_nb', 'pickup_sc', 'overnight_ca', 'overnight_national', 'overnight_remote'
  shipping_address JSONB, -- { name, street, street2, city, state, zip }
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,

  -- Stripe
  stripe_payment_intent_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shop_orders_patient_id ON shop_orders(patient_id);
CREATE INDEX idx_shop_orders_order_number ON shop_orders(order_number);
CREATE INDEX idx_shop_orders_status ON shop_orders(status);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shop_accounts_updated_at
  BEFORE UPDATE ON shop_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_orders_updated_at
  BEFORE UPDATE ON shop_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
