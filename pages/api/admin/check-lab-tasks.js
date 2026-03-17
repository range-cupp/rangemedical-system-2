// /pages/api/admin/check-lab-tasks.js
// Diagnostic: returns all pending lab review tasks without modifying anything.
// Protected by ADMIN_PASSWORD.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Return ALL pending lab tasks so we can see exact titles/categories
    const { data: tasks, error: taskErr } = await supabase
      .from('tasks')
      .select('id, title, category, status, patient_name, assigned_to')
      .eq('status', 'pending')
      .eq('category', 'labs')
      .order('created_at', { ascending: false })
      .limit(50);

    if (taskErr) return res.status(500).json({ error: taskErr.message });

    // Also check what happens with the backfill filter specifically
    const { data: filtered, error: filteredErr } = await supabase
      .from('tasks')
      .select('id, title, category, status, patient_name')
      .eq('category', 'labs')
      .eq('status', 'pending')
      .like('title', '%Review labs%');

    return res.status(200).json({
      success: true,
      allPendingLabTasks: {
        count: tasks?.length ?? 0,
        tasks: tasks?.map(t => ({ id: t.id, title: t.title, category: t.category, status: t.status, patient: t.patient_name })) ?? [],
      },
      backfillFilterMatches: {
        count: filtered?.length ?? 0,
        tasks: filtered?.map(t => ({ id: t.id, title: t.title, patient: t.patient_name })) ?? [],
        filterError: filteredErr?.message ?? null,
      },
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
