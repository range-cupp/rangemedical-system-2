-- Migration: Employee Login System + Audit Log
-- Range Medical System
-- Created: 2026-03-08

-- =============================================
-- EMPLOYEES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Staff',
  is_admin BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{}',
  pin TEXT,
  calcom_user_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for email lookup during auth
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
-- Index for active employees
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active) WHERE is_active = true;

-- =============================================
-- AUDIT LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  employee_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by employee
CREATE INDEX IF NOT EXISTS idx_audit_log_employee ON audit_log(employee_id);
-- Index for querying by action type
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
-- Index for querying by time (most recent first)
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
