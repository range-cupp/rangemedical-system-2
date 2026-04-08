// /pages/api/cron/task-digest.js
// Nightly task digest — sends each active employee a summary of their pending tasks
// Runs nightly at 6 PM PST (2 AM UTC) — only sends to employees who have pending tasks
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';
import { isInQuietHours } from '../../../lib/quiet-hours';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check quiet hours (skip if outside 8am-8pm Pacific, unless forced)
  const force = req.query?.force === 'true';
  if (!force && isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'Outside Pacific send window (8 AM – 8 PM)' });
  }

  try {
    const now = new Date();
    const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const today = pacificDate.toISOString().split('T')[0];
    const displayDate = pacificDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          timeZone: 'America/Los_Angeles',
    });

    console.log(`Task Digest — ${displayDate}`);

    // Fetch all active employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, email, title')
      .eq('is_active', true)
      .order('name');

    if (empError) throw empError;
    if (!employees?.length) {
      return res.status(200).json({ success: true, message: 'No active employees', sent: 0 });
    }

    // Fetch all pending tasks in one query
    const { data: allTasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .order('due_date', { ascending: true, nullsFirst: false });

    if (taskError) throw taskError;

    const results = [];
    let totalSent = 0;
    let totalSkipped = 0;

    for (const employee of employees) {
      const myTasks = (allTasks || []).filter(t => t.assigned_to === employee.id);

      // Don't send an email if this person has nothing to do
      if (myTasks.length === 0) {
        totalSkipped++;
        results.push({ employee: employee.name, status: 'skipped', reason: 'no pending tasks' });
        continue;
      }

      const subject = `Your task list — ${myTasks.length} pending (${displayDate})`;
      const html = buildDigestEmail({ employee, tasks: myTasks, displayDate, today });

      const { error: sendError } = await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: employee.email,
        subject,
        html,
      });

      if (sendError) {
        console.error(`Task Digest send error for ${employee.email}:`, sendError);
        results.push({ employee: employee.name, status: 'error', error: sendError.message });
        await logComm({
          channel: 'email',
          messageType: 'task_digest',
          message: subject,
          source: 'cron/task-digest',
          recipient: employee.email,
          subject,
          status: 'error',
          errorMessage: sendError.message || String(sendError),
        });
        continue;
      }

      await logComm({
        channel: 'email',
        messageType: 'task_digest',
        message: `Sent ${myTasks.length} tasks to ${employee.name}`,
        source: 'cron/task-digest',
        recipient: employee.email,
        subject,
        status: 'sent',
      });

      results.push({ employee: employee.name, email: employee.email, status: 'sent', taskCount: myTasks.length });
      totalSent++;
    }

    console.log(`✓ Task Digest complete — ${totalSent} sent, ${totalSkipped} skipped (no tasks)`);

    return res.status(200).json({
      success: true,
      date: today,
      totalEmployees: employees.length,
      sent: totalSent,
      skipped: totalSkipped,
      results,
    });
  } catch (error) {
    console.error('Task Digest error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── Priority helpers ──────────────────────────────────────────────────────────

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
  medium: { label: 'Medium', color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  low:    { label: 'Low',    color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6' },
};

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    // 1. Overdue first
    const aOverdue = a.due_date && a.due_date < todayPacific();
    const bOverdue = b.due_date && b.due_date < todayPacific();
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    // 2. Priority
    const aPri = PRIORITY_ORDER[a.priority] ?? 1;
    const bPri = PRIORITY_ORDER[b.priority] ?? 1;
    if (aPri !== bPri) return aPri - bPri;
    // 3. Due date ascending
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });
}

function formatDueDate(due_date) {
  if (!due_date) return null;
  const today = todayPacific();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (due_date < today) {
    const daysAgo = Math.round((new Date(today) - new Date(due_date)) / 86400000);
    return { label: daysAgo === 1 ? 'Overdue by 1 day' : `Overdue by ${daysAgo} days`, overdue: true };
  }
  if (due_date === today) return { label: 'Due today', overdue: false, urgent: true };
  if (due_date === tomorrow) return { label: 'Due tomorrow', overdue: false };
  return {
    label: new Date(due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' }),
    overdue: false,
  };
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildDigestEmail({ employee, tasks, displayDate, today }) {
  const sorted = sortTasks(tasks);
  const overdueTasks = sorted.filter(t => t.due_date && t.due_date < today);
  const dueTodayTasks = sorted.filter(t => t.due_date === today);
  const upcomingTasks = sorted.filter(t => !t.due_date || t.due_date > today);

  const highCount = tasks.filter(t => t.priority === 'high').length;
  const firstName = employee.name.split(' ')[0];

  const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

  const buildTaskRow = (task, idx) => {
    const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const due = formatDueDate(task.due_date);
    const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';

    const dueBadge = due ? `
      <span style="
        display: inline-block;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        background: ${due.overdue ? '#fef2f2' : due.urgent ? '#fff7ed' : '#f3f4f6'};
        color: ${due.overdue ? '#dc2626' : due.urgent ? '#c2410c' : '#6b7280'};
        margin-left: 6px;
      ">${due.label}</span>` : '';

    const patientBadge = task.patient_name ? `
      <div style="margin-top: 3px; font-size: 12px; color: #6b7280;">
        👤 ${task.patient_name}
      </div>` : '';

    const descSnippet = task.description ? `
      <div style="margin-top: 3px; font-size: 12px; color: #9ca3af; line-height: 1.4;">
        ${task.description.length > 120 ? task.description.slice(0, 120) + '…' : task.description}
      </div>` : '';

    return `
      <tr style="background: ${bg};">
        <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; vertical-align: top; width: 8px;">
          <span style="
            display: inline-block;
            width: 8px; height: 8px;
            border-radius: 50%;
            background: ${pri.dot};
            margin-top: 5px;
          "></span>
        </td>
        <td style="padding: 12px 4px 12px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
          <span style="
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            background: ${pri.bg};
            color: ${pri.color};
            letter-spacing: 0.04em;
          ">${pri.label}</span>
        </td>
        <td style="padding: 12px 16px 12px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
          <div style="font-size: 14px; font-weight: 600; color: #111827; line-height: 1.4;">
            ${task.title}${dueBadge}
          </div>
          ${patientBadge}
          ${descSnippet}
        </td>
      </tr>`;
  };

  const buildSection = (label, emoji, sectionTasks) => {
    if (sectionTasks.length === 0) return '';
    return `
      <div style="margin-bottom: 28px;">
        <div style="
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e5e7eb;
        ">${emoji}&nbsp; ${label} <span style="color: #9ca3af; font-weight: 400;">(${sectionTasks.length})</span></div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          ${sectionTasks.map((t, i) => buildTaskRow(t, i)).join('')}
        </table>
      </div>`;
  };

  const greetingNote = overdueTasks.length > 0
    ? `You have <strong style="color: #dc2626;">${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}</strong> that need${overdueTasks.length === 1 ? 's' : ''} attention.`
    : highCount > 0
    ? `You have <strong>${highCount} high-priority task${highCount > 1 ? 's' : ''}</strong> pending today.`
    : `Here's what's on your plate.`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: #111827; padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                      Your Task List
                    </div>
                    <div style="font-size: 13px; color: #9ca3af; margin-top: 4px;">${displayDate}</div>
                  </td>
                  <td align="right">
                    <div style="font-size: 36px; font-weight: 800; color: #ffffff; line-height: 1;">${tasks.length}</div>
                    <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em;">Pending</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary bar -->
          <tr>
            <td style="background: #f9fafb; padding: 14px 32px; border-bottom: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${overdueTasks.length > 0 ? `
                  <td style="text-align: center; padding: 0 12px;">
                    <div style="font-size: 22px; font-weight: 700; color: #dc2626;">${overdueTasks.length}</div>
                    <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase;">Overdue</div>
                  </td>` : ''}
                  ${dueTodayTasks.length > 0 ? `
                  <td style="text-align: center; padding: 0 12px;">
                    <div style="font-size: 22px; font-weight: 700; color: #c2410c;">${dueTodayTasks.length}</div>
                    <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase;">Due Today</div>
                  </td>` : ''}
                  <td style="text-align: center; padding: 0 12px;">
                    <div style="font-size: 22px; font-weight: 700; color: #dc2626;">${highCount}</div>
                    <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase;">High Priority</div>
                  </td>
                  <td style="text-align: center; padding: 0 12px;">
                    <div style="font-size: 22px; font-weight: 700; color: #374151;">${tasks.length}</div>
                    <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase;">Total Pending</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 32px;">

              <!-- Greeting -->
              <p style="font-size: 15px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                Hi ${firstName}, ${greetingNote}
              </p>

              <!-- Task sections -->
              ${buildSection('Overdue', '🔴', overdueTasks)}
              ${buildSection('Due Today', '🟡', dueTodayTasks)}
              ${buildSection('Upcoming', '📋', upcomingTasks)}

              <!-- CTA -->
              <div style="text-align: center; margin-top: 8px;">
                <a href="${appUrl}/admin/tasks"
                   style="
                     display: inline-block;
                     padding: 12px 28px;
                     background: #2563eb;
                     color: #ffffff;
                     font-size: 14px;
                     font-weight: 600;
                     border-radius: 8px;
                     text-decoration: none;
                     letter-spacing: 0.02em;
                   ">
                  Open Task Board →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <div style="font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6;">
                Range Medical — Nightly task digest — ${displayDate}<br/>
                <span style="font-size: 11px;">You're receiving this because you have active tasks assigned to you.</span>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
