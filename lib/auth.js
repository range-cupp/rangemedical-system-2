// /lib/auth.js
// Authentication & authorization helpers
// Range Medical System

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// All available permissions
export const PERMISSIONS = {
  can_manage_patients: 'Manage Patients',
  can_manage_protocols: 'Manage Protocols',
  can_manage_schedules: 'Manage Schedules',
  can_view_financials: 'View Financials',
  can_manage_communications: 'Manage Communications',
  can_log_services: 'Log Services',
  can_manage_employees: 'Manage Employees',
};

/**
 * Extract session from request headers
 * Expects: Authorization: Bearer <access_token>
 */
export async function getSession(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return { user, token };
}

/**
 * Get the employee record for the current authenticated user
 */
export async function getEmployee(req) {
  const session = await getSession(req);
  if (!session) return null;

  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('email', session.user.email)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !employee) return null;

  return employee;
}

/**
 * Middleware: Require authenticated employee
 * Returns employee if authenticated, sends 401 if not
 */
export async function requireAuth(req, res) {
  const employee = await getEmployee(req);

  if (!employee) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  return employee;
}

/**
 * Middleware: Require specific permission
 * Returns employee if authorized, sends 403 if not
 */
export async function requirePermission(req, res, permission) {
  const employee = await requireAuth(req, res);
  if (!employee) return null; // 401 already sent

  if (!hasPermission(employee, permission)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return null;
  }

  return employee;
}

/**
 * Check if employee has a specific permission
 * Admin always has all permissions
 */
export function hasPermission(employee, permission) {
  if (!employee) return false;
  if (employee.is_admin) return true;
  return employee.permissions?.[permission] === true;
}

/**
 * Get all permissions for an employee (resolved)
 */
export function getResolvedPermissions(employee) {
  if (!employee) return {};
  if (employee.is_admin) {
    // Admin gets all permissions
    return Object.keys(PERMISSIONS).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
  }
  return employee.permissions || {};
}

/**
 * Log an action to the audit_log table
 */
export async function logAction({
  employeeId,
  employeeName,
  action,
  resourceType = null,
  resourceId = null,
  details = null,
  req = null,
}) {
  try {
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || null;

    await supabase.from('audit_log').insert({
      employee_id: employeeId,
      employee_name: employeeName,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details ? (typeof details === 'string' ? { message: details } : details) : null,
      ip_address: ip,
    });
  } catch (err) {
    console.error('Failed to log audit action:', err);
  }
}
