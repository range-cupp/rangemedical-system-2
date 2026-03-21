// GET /api/admin/activity-log
// Returns audit log entries for the activity log page
// Supports pagination and filtering by employee, action, date range

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      limit = '50',
      offset = '0',
      employee_name,
      action,
      resource_type,
      start_date,
      end_date,
    } = req.query;

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (employee_name) {
      query = query.ilike('employee_name', `%${employee_name}%`);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (resource_type) {
      query = query.eq('resource_type', resource_type);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: entries, error, count } = await query;

    if (error) {
      console.error('Activity log fetch error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ entries, total: count });
  } catch (error) {
    console.error('Activity log error:', error);
    return res.status(500).json({ error: error.message });
  }
}
