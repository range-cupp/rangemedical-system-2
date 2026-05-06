// lib/notify-task-assignee.js
// Posts task notifications into per-employee "Tasks – {Name}" group channels.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { postToStaffChannel } from './post-to-staff-channel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function notifyTaskAssignee(employeeId, { assignerName, taskTitle, priority, skipPush } = {}) {
  if (!employeeId) return;

  const { data: emp } = await supabase
    .from('employees')
    .select('email, name')
    .eq('id', employeeId)
    .single();

  if (!emp?.email) return;

  const firstName = emp.name.split(' ')[0];
  const priorityLabel = priority === 'urgent' ? '🔴 URGENT: ' : priority === 'high' ? '🟠 ' : '';
  const truncatedTitle = taskTitle && taskTitle.length > 200 ? `${taskTitle.slice(0, 200)}…` : (taskTitle || 'New task');
  const content = `${priorityLabel}New task from ${assignerName || 'Range Medical'}\n\n${truncatedTitle}\n\nOpen the Tasks page in the CRM to view details.`;

  await postToStaffChannel({
    channelName: `Tasks – ${firstName}`,
    memberEmails: [emp.email],
    content,
    skipPush,
    pushPayload: {
      title: priority === 'urgent' ? '🔴 URGENT task' : 'New task',
      body: truncatedTitle.length > 100 ? `${truncatedTitle.slice(0, 100)}…` : truncatedTitle,
    },
  });
}
