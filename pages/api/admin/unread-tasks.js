// /pages/api/admin/unread-tasks.js
// Returns count of pending tasks assigned to an employee + overdue count + new task details
// Polled from AdminLayout for task badge notifications + toast/sound/browser notifications
// Range Medical System

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employee_id, since } = req.query;
  if (!employee_id) {
    return res.status(200).json({ count: 0, overdueCount: 0 });
  }

  try {
    // Get pending task count
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', employee_id)
      .eq('status', 'pending');

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return res.status(200).json({ count: 0, overdueCount: 0 });
      }
      console.error('Unread tasks error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Get overdue count (pending tasks with due_date in the past)
    const today = todayPacific();
    const { count: overdueCount, error: overdueError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', employee_id)
      .eq('status', 'pending')
      .lt('due_date', today);

    if (overdueError) {
      console.error('Overdue tasks error:', overdueError);
    }

    // If `since` timestamp provided, check for new tasks created after that time
    // Used for real-time notifications (sound, toast, browser notification)
    let newTasks = [];
    if (since) {
      const { data: newTaskData, error: newError } = await supabase
        .from('tasks')
        .select('id, title, assigned_by, priority, created_at')
        .eq('assigned_to', employee_id)
        .eq('status', 'pending')
        .gt('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!newError && newTaskData?.length > 0) {
        // Enrich with creator names
        const creatorIds = [...new Set(newTaskData.map(t => t.assigned_by))];
        const { data: creators } = await supabase
          .from('employees')
          .select('id, name')
          .in('id', creatorIds);
        const creatorMap = {};
        (creators || []).forEach(c => { creatorMap[c.id] = c.name; });

        newTasks = newTaskData.map(t => ({
          ...t,
          assigned_by_name: creatorMap[t.assigned_by] || 'Unknown',
        }));
      }
    }

    // Get latest task timestamp for tracking
    const { data: latestTask } = await supabase
      .from('tasks')
      .select('created_at')
      .eq('assigned_to', employee_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    res.setHeader('Cache-Control', 'private, max-age=5');
    return res.status(200).json({
      count: count || 0,
      overdueCount: overdueCount || 0,
      newTasks,
      latestTimestamp: latestTask?.[0]?.created_at || null,
    });
  } catch (error) {
    console.error('Unread tasks error:', error);
    return res.status(200).json({ count: 0, overdueCount: 0 });
  }
}
