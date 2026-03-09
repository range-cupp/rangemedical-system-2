// /pages/api/admin/employees/[id]/index.js
// Update or deactivate an employee
// Range Medical System

import { createClient } from '@supabase/supabase-js';
import { requirePermission, logAction } from '../../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'PATCH') {
    return handleUpdate(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleUpdate(req, res) {
  const employee = await requirePermission(req, res, 'can_manage_employees');
  if (!employee) return;

  const { id } = req.query;
  const { name, title, is_admin, permissions, is_active, calcom_user_id, password } = req.body;

  try {
    // Build update object (only include provided fields)
    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (title !== undefined) updates.title = title;
    if (is_admin !== undefined) updates.is_admin = is_admin;
    if (permissions !== undefined) updates.permissions = permissions;
    if (is_active !== undefined) updates.is_active = is_active;
    if (calcom_user_id !== undefined) updates.calcom_user_id = calcom_user_id;

    const { data: updated, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If password reset requested, update auth user
    if (password) {
      // Look up auth user by email
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const authUser = users?.find(u => u.email === updated.email);
      if (authUser) {
        await supabase.auth.admin.updateUserById(authUser.id, { password });
      }
    }

    // Log action
    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'update_employee',
      resourceType: 'employee',
      resourceId: id,
      details: { changes: Object.keys(updates).filter(k => k !== 'updated_at') },
      req,
    });

    return res.status(200).json({ success: true, employee: updated });

  } catch (error) {
    console.error('Update employee error:', error);
    return res.status(500).json({ error: error.message });
  }
}
