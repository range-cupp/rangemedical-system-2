// Removes Chris (the system sender) from other employees' task channels.
// He was added when the channels were created — but each task channel should
// only contain the assignee, so each person sees only their own tasks.
// Existing messages keep their sender_id, so they still display as "Chris: ..."
// in the UI even though Chris is no longer a member.

import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: chris } = await s
    .from('employees')
    .select('id')
    .eq('email', 'cupp@range-medical.com')
    .single();
  if (!chris) { console.error('Chris not found'); return; }

  // Find all task channels (named "Tasks – ...")
  const { data: channels } = await s
    .from('staff_channels')
    .select('id, name')
    .eq('type', 'group')
    .like('name', 'Tasks –%');

  if (!channels?.length) { console.log('No task channels found.'); return; }

  for (const ch of channels) {
    // Keep Chris in his own channel
    if (ch.name === 'Tasks – Chris') {
      console.log(`${ch.name}: keeping Chris (his own channel)`);
      continue;
    }

    // Get current members
    const { data: members } = await s
      .from('staff_channel_members')
      .select('employee_id')
      .eq('channel_id', ch.id);

    const hasChris = members?.some(m => m.employee_id === chris.id);
    if (!hasChris) {
      console.log(`${ch.name}: Chris already not a member`);
      continue;
    }

    const { error } = await s
      .from('staff_channel_members')
      .delete()
      .eq('channel_id', ch.id)
      .eq('employee_id', chris.id);

    if (error) {
      console.error(`${ch.name}: failed to remove Chris:`, error);
    } else {
      console.log(`${ch.name}: removed Chris`);
    }
  }

  console.log('\nDone.');
}

run().catch(console.error);
