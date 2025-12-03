-- Range Medical Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protocols table
CREATE TABLE protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- peptide, hrt, weightloss, iv, hbot, rlt
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  duration INTEGER, -- in days
  status TEXT DEFAULT 'active', -- active, completed, paused
  price DECIMAL(10, 2),
  
  -- Protocol-specific fields
  injection_schedule TEXT,
  dosing TEXT,
  current_dose TEXT,
  target_dose TEXT,
  next_dose_increase DATE,
  next_lab_date DATE,
  sessions_total INTEGER,
  sessions_completed INTEGER DEFAULT 0,
  last_session DATE,
  indication TEXT,
  notes TEXT,
  
  -- Stripe integration
  stripe_transaction_id TEXT,
  stripe_customer_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Labs table
CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  lab_date DATE NOT NULL,
  panel_type TEXT NOT NULL, -- Male Elite Panel, Female Elite Panel, etc.
  results JSONB, -- Store all lab values as JSON
  pdf_url TEXT, -- Link to uploaded PDF
  notes TEXT,
  next_lab_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Symptoms tracking table
CREATE TABLE symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  protocol_id UUID REFERENCES protocols(id) ON DELETE SET NULL,
  symptom_date DATE NOT NULL,
  
  -- Symptom scores (1-10)
  energy INTEGER CHECK (energy >= 1 AND energy <= 10),
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  sleep INTEGER CHECK (sleep >= 1 AND sleep <= 10),
  recovery INTEGER CHECK (recovery >= 1 AND recovery <= 10),
  libido INTEGER CHECK (libido >= 1 AND libido <= 10),
  brain_fog INTEGER CHECK (brain_fog >= 1 AND brain_fog <= 10),
  appetite INTEGER CHECK (appetite >= 1 AND appetite <= 10),
  pain INTEGER CHECK (pain >= 1 AND pain <= 10),
  bloating INTEGER CHECK (bloating >= 1 AND bloating <= 10),
  inflammation INTEGER CHECK (inflammation >= 1 AND inflammation <= 10),
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Measurements table
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  
  weight DECIMAL(5, 1),
  body_fat DECIMAL(4, 1),
  waist DECIMAL(4, 1),
  blood_pressure TEXT, -- Format: "120/80"
  
  -- Additional measurements
  hip DECIMAL(4, 1),
  chest DECIMAL(4, 1),
  arm DECIMAL(4, 1),
  thigh DECIMAL(4, 1),
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table (system-generated)
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- lab_due, lab_overdue, protocol_ending, dose_increase, symptom_missing
  priority TEXT NOT NULL, -- high, medium, low
  message TEXT NOT NULL,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table (for tracking IV, HBOT, RLT individual sessions)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_number INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_protocols_patient_id ON protocols(patient_id);
CREATE INDEX idx_protocols_status ON protocols(status);
CREATE INDEX idx_labs_patient_id ON labs(patient_id);
CREATE INDEX idx_symptoms_patient_id ON symptoms(patient_id);
CREATE INDEX idx_measurements_patient_id ON measurements(patient_id);
CREATE INDEX idx_alerts_patient_id ON alerts(patient_id);
CREATE INDEX idx_sessions_protocol_id ON sessions(protocol_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocols_updated_at BEFORE UPDATE ON protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labs_updated_at BEFORE UPDATE ON labs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations - you can restrict later)
CREATE POLICY "Enable all operations for authenticated users" ON patients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON protocols
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON labs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON symptoms
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON measurements
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON alerts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON sessions
  FOR ALL USING (true) WITH CHECK (true);
