// lib/notify-task-assignee.js
// Posts task notifications into the assignee's personal task channel.
// Range Medical

import { postToTaskChannel } from './post-to-staff-channel';

export async function notifyTaskAssignee(employeeId, { assignerName, taskTitle, priority, skipPush } = {}) {
  if (!employeeId) return;

  const priorityLabel = priority === 'urgent' ? '🔴 URGENT: ' : priority === 'high' ? '🟠 ' : '';
  const truncatedTitle = taskTitle && taskTitle.length > 200 ? `${taskTitle.slice(0, 200)}…` : (taskTitle || 'New task');
  const content = `${priorityLabel}New task from ${assignerName || 'Range Medical'}\n\n${truncatedTitle}\n\nOpen the Tasks page in the CRM to view details.`;

  await postToTaskChannel({
    employeeId,
    content,
    skipPush,
    pushPayload: {
      title: priority === 'urgent' ? '🔴 URGENT task' : 'New task',
      body: truncatedTitle.length > 100 ? `${truncatedTitle.slice(0, 100)}…` : truncatedTitle,
    },
  });
}
