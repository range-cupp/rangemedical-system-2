// /pages/api/app/today.js
// GET: today's dashboard data — appointments, service log count, tasks, recent patients
// Range Medical Employee App

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const today = todayPacific();
  const todayStart = `${today}T00:00:00.000Z`;
  const todayEnd = `${today}T23:59:59.999Z`;

  const [serviceLogsRes, tasksRes, unreadSmsRes] = await Promise.all([
    // Today's service log entries
    supabase
      .from('service_logs')
      .select('id, entry_date, entry_type, category, medication, patient_id, patients(first_name, last_name)')
      .eq('entry_date', today)
      .order('created_at', { ascending: false })
      .limit(20),

    // Open tasks
    supabase
      .from('tasks')
      .select('id, title, due_date, priority, status, patient_id')
      .eq('status', 'open')
      .order('due_date', { ascending: true })
      .limit(10),

    // Unread inbound SMS count (read_at is null = unread)
    supabase
      .from('comms_log')
      .select('id', { count: 'exact' })
      .eq('direction', 'inbound')
      .is('read_at', null),
  ]);

  return res.status(200).json({
    date: today,
    service_log: {
      count: serviceLogsRes.data?.length || 0,
      entries: serviceLogsRes.data || [],
    },
    tasks: {
      open_count: tasksRes.count || tasksRes.data?.length || 0,
      items: tasksRes.data || [],
    },
    unread_sms: unreadSmsRes.count ?? unreadSmsRes.data?.length ?? 0,
  });
}
