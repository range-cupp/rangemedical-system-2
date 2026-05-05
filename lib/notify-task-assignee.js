// lib/notify-task-assignee.js
// Pings an employee in the internal chat app when a task is assigned to them.
// Was an SMS originally — switched to chat DM since staff are on the Range
// Medical PWA now and SMS noise was getting heavy.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { postDmToEmployee } from './post-to-staff-channel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function notifyTaskAssignee(employeeId, { assignerName, taskTitle, priority } = {}) {
  if (!employeeId) return;

  const { data: emp } = await supabase
    .from('employees')
    .select('email, name')
    .eq('id', employeeId)
    .single();

  if (!emp?.email) return;

  const priorityLabel = priority === 'urgent' ? '🔴 URGENT: ' : priority === 'high' ? '🟠 ' : '';
  const truncatedTitle = taskTitle && taskTitle.length > 200 ? `${taskTitle.slice(0, 200)}…` : (taskTitle || 'New task');
  const content = `${priorityLabel}New task from ${assignerName || 'Range Medical'}\n\n${truncatedTitle}\n\nOpen the Tasks page in the CRM to view details.`;

  await postDmToEmployee({
    recipientEmail: emp.email,
    content,
    pushPayload: {
      title: priority === 'urgent' ? '🔴 URGENT task' : 'New task',
      body: truncatedTitle.length > 100 ? `${truncatedTitle.slice(0, 100)}…` : truncatedTitle,
    },
  });
}
