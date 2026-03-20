// /pages/api/admin/employees/index.js
// List and create employees
// Range Medical System

import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePermission, logAction } from '../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleList(req, res);
  }
  if (req.method === 'POST') {
    return handleCreate(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req, res) {
  const { basic } = req.query;

  // Basic list (id, name, is_active, calcom_user_id) — no auth required
  // Used by calendar employee view, task assignment, etc.
  // Page-level auth handles access control
  if (basic === 'true') {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id, name, title, is_active, calcom_user_id')
        .order('name');

      if (error) throw error;

      return res.status(200).json({ success: true, employees: employees || [] });
    } catch (error) {
      console.error('List employees (basic) error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Full list with sensitive fields requires can_manage_employees permission
  const employee = await requirePermission(req, res, 'can_manage_employees');
  if (!employee) return;

  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, email, name, title, is_admin, permissions, calcom_user_id, phone, is_active, created_at')
      .order('name');

    if (error) throw error;

    return res.status(200).json({ success: true, employees: employees || [] });
  } catch (error) {
    console.error('List employees error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleCreate(req, res) {
  const employee = await requirePermission(req, res, 'can_manage_employees');
  if (!employee) return;

  try {
    const { email, name, title, is_admin, permissions, calcom_user_id, phone, password } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Create Supabase Auth user
    const tempPassword = password || `Range${Math.random().toString(36).slice(2, 10)}!`;

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: true, // Skip email verification
    });

    if (authError) {
      // If user already exists in auth, that's OK — just create the employee record
      if (!authError.message?.includes('already been registered')) {
        return res.status(400).json({ error: `Auth error: ${authError.message}` });
      }
    }

    // Create employee record
    const { data: newEmployee, error: insertError } = await supabase
      .from('employees')
      .insert({
        email: email.trim().toLowerCase(),
        name,
        title: title || 'Staff',
        is_admin: is_admin || false,
        permissions: permissions || {},
        calcom_user_id: calcom_user_id || null,
        phone: phone || null,
      })
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    // Log action
    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'create_employee',
      resourceType: 'employee',
      resourceId: newEmployee.id,
      details: { name, email, title },
      req,
    });

    return res.status(201).json({
      success: true,
      employee: newEmployee,
      tempPassword: password ? undefined : tempPassword,
    });

  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ error: error.message });
  }
}
