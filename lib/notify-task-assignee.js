// lib/notify-task-assignee.js
// Sends an SMS to an employee when a task is assigned to them.
// Respects quiet hours (7am-8pm PST) — queues to notification_queue outside that window.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from './send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function notifyTaskAssignee(employeeId, { assignerName, taskTitle, priority } = {}) {
  const { data: emp } = await supabase
    .from('employees')
    .select('phone, name')
    .eq('id', employeeId)
    .single();

  if (!emp?.phone) return;

  const now = new Date();
  const pst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const hour = pst.getHours();
  const isQuietHours = hour < 7 || hour >= 20;

  const message = buildTaskSmsMessage(assignerName, taskTitle, priority);

  if (isQuietHours) {
    try {
      await supabase.from('notification_queue').insert({
        type: 'task_assignment_sms',
        recipient_phone: normalizePhone(emp.phone),
        recipient_name: emp.name,
        message,
        status: 'pending',
        scheduled_for: getNextBusinessHourStart(),
        metadata: { employee_id: employeeId, task_title: taskTitle },
      });
    } catch (e) {
      console.error('Failed to queue task notification:', e);
    }
    return;
  }

  await sendSMS({
    to: normalizePhone(emp.phone),
    message,
    log: {
      messageType: 'task_assignment',
      source: 'notify-task-assignee',
    },
  });
}

function buildTaskSmsMessage(assignerName, taskTitle, priority) {
  const priorityLabel = priority === 'urgent' ? '\ud83d\udd34 URGENT: ' : priority === 'high' ? '\ud83d\udfe0 ' : '';
  const truncatedTitle = taskTitle.length > 120 ? taskTitle.slice(0, 120) + '...' : taskTitle;
  return `${priorityLabel}New task from ${assignerName}: ${truncatedTitle}\n\nView in Range Medical CRM \u2192 Tasks`;
}

function getNextBusinessHourStart() {
  const now = new Date();
  const pstStr = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  const pst = new Date(pstStr);
  pst.setDate(pst.getDate() + 1);
  pst.setHours(8, 0, 0, 0);
  const utcOffset = now.getTime() - new Date(pstStr).getTime();
  return new Date(pst.getTime() + utcOffset).toISOString();
}
