import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CHRIS_EMAIL = 'cupp@range-medical.com';

async function run() {
  const { data: chris } = await s.from('employees').select('id').eq('email', CHRIS_EMAIL).single();
  if (!chris) { console.error('Chris not found'); return; }

  const { data: employees } = await s
    .from('employees')
    .select('id, name, email')
    .eq('is_active', true)
    .order('name');

  const { data: tasks } = await s
    .from('tasks')
    .select('id, title, assigned_to, assigned_by, status, priority, patient_name, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const empMap = {};
  employees.forEach(e => { empMap[e.id] = e; });

  const byAssignee = {};
  tasks.forEach(t => {
    if (!byAssignee[t.assigned_to]) byAssignee[t.assigned_to] = [];
    byAssignee[t.assigned_to].push(t);
  });

  for (const emp of employees) {
    const firstName = emp.name.split(' ')[0];
    const channelName = `Tasks – ${firstName}`;
    const empTasks = byAssignee[emp.id] || [];

    // Find or create channel
    const { data: existing } = await s
      .from('staff_channels')
      .select('id')
      .eq('type', 'group')
      .eq('name', channelName)
      .limit(1);

    let channelId;
    if (existing?.length) {
      channelId = existing[0].id;
      console.log(`${channelName}: channel exists (${channelId.slice(0, 8)})`);
    } else {
      const { data: ch, error } = await s
        .from('staff_channels')
        .insert({ name: channelName, type: 'group', created_by: chris.id })
        .select('id')
        .single();
      if (error) { console.error(`Failed to create ${channelName}:`, error); continue; }
      channelId = ch.id;

      const memberIds = [...new Set([chris.id, emp.id])];
      await s.from('staff_channel_members').insert(
        memberIds.map(employee_id => ({ channel_id: channelId, employee_id }))
      );
      console.log(`${channelName}: created (${channelId.slice(0, 8)})`);
    }

    if (empTasks.length === 0) {
      console.log(`  → 0 pending tasks, skipping`);
      continue;
    }

    // Check for existing messages to avoid double-backfill
    const { count } = await s
      .from('staff_messages')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', channelId);

    if (count > 0) {
      console.log(`  → channel already has ${count} messages, skipping backfill`);
      continue;
    }

    // Build messages for each task
    const messages = empTasks.map(t => {
      const priorityLabel = t.priority === 'urgent' ? '🔴 URGENT: ' : t.priority === 'high' ? '🟠 ' : '';
      const assigner = empMap[t.assigned_by]?.name || 'Range Medical';
      const dateStr = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const patientLine = t.patient_name ? `\nPatient: ${t.patient_name}` : '';
      return {
        channel_id: channelId,
        sender_id: chris.id,
        content: `${priorityLabel}Task from ${assigner} (${dateStr})\n\n${t.title}${patientLine}`,
        created_at: t.created_at,
      };
    });

    // Batch insert (Supabase handles arrays)
    const { error: insertErr } = await s.from('staff_messages').insert(messages);
    if (insertErr) {
      console.error(`  → message insert failed:`, insertErr);
      continue;
    }

    // Bump channel updated_at
    await s.from('staff_channels').update({ updated_at: new Date().toISOString() }).eq('id', channelId);

    // Mark as read for both members so they don't see a wall of unreads
    await s.from('staff_channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channelId);

    console.log(`  → backfilled ${empTasks.length} tasks`);
  }

  console.log('\nDone.');
}

run().catch(console.error);
