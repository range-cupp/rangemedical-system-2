// /pages/api/admin/unread-tasks.js
// Returns count of pending tasks assigned to an employee
// Polled from AdminLayout for task badge notifications
// Range Medical System

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employee_id } = req.query;
  if (!employee_id) {
    return res.status(200).json({ count: 0 });
  }

  try {
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', employee_id)
      .eq('status', 'pending');

    if (error) {
      // Table might not exist yet — return 0 silently
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return res.status(200).json({ count: 0 });
      }
      console.error('Unread tasks error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.setHeader('Cache-Control', 'private, max-age=5');
    return res.status(200).json({ count: count || 0 });
  } catch (error) {
    console.error('Unread tasks error:', error);
    return res.status(200).json({ count: 0 });
  }
}
