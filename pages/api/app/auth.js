// /pages/api/app/auth.js
// Staff PIN login — validates PIN against employees table, returns session data
// Supports two modes:
//   - With employee_id: scoped validation (name-picker flow, handles shared PINs)
//   - Without employee_id: PIN-only match (legacy, requires unique PINs)
// Range Medical Employee App

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Return active employee list for name-picker screen
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, title')
      .eq('is_active', true)
      .order('name');

    if (error) return res.status(500).json({ error: 'Failed to load employees' });
    return res.status(200).json({ employees: employees || [] });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pin, employee_id } = req.body;

  if (!pin || typeof pin !== 'string' || pin.length < 4) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  // Build query — scope to employee_id when provided (name-picker flow).
  // This prevents .single() / .maybeSingle() from failing when multiple
  // employees share the same PIN (e.g., temporary default "1234").
  let query = supabase
    .from('employees')
    .select('id, name, title, email, is_admin, permissions, calcom_user_id, phone')
    .eq('pin', pin.trim())
    .eq('is_active', true);

  if (employee_id) {
    query = query.eq('id', employee_id);
  }

  const { data: employee, error } = await query.limit(1).maybeSingle();

  if (error || !employee) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  // Return session data (stored in localStorage by client)
  return res.status(200).json({
    success: true,
    session: {
      id: employee.id,
      name: employee.name,
      title: employee.title,
      email: employee.email,
      is_admin: employee.is_admin || false,
      permissions: employee.permissions || {},
      calcom_user_id: employee.calcom_user_id,
      phone: employee.phone,
      logged_in_at: new Date().toISOString(),
    },
  });
}
