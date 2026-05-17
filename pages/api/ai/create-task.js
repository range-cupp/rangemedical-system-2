// /pages/api/ai/create-task.js
// Creates a staff task from the AI assistant
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, description, assigned_to_name, patient_id, patient_name, priority, due_date, task_category, created_by_id } = req.body;

  if (!title || !assigned_to_name) {
    return res.status(400).json({ error: 'title and assigned_to_name are required' });
  }

  try {
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name')
      .eq('is_active', true);

    const q = assigned_to_name.toLowerCase();
    const assignee = (employees || []).find(e => e.name.toLowerCase() === q)
      || (employees || []).find(e => e.name.toLowerCase().includes(q));

    if (!assignee) {
      const names = (employees || []).map(e => e.name).join(', ');
      return res.status(400).json({ error: `Staff member "${assigned_to_name}" not found. Available: ${names}` });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description: description || null,
        assigned_to: assignee.id,
        assigned_by: created_by_id || assignee.id,
        patient_id: patient_id || null,
        patient_name: patient_name || null,
        priority: priority || 'medium',
        due_date: due_date || null,
        task_category: task_category || 'business',
        status: 'pending',
      })
      .select('id, title, status, priority, due_date')
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, task: data, assigned_to_name: assignee.name });
  } catch (err) {
    console.error('Create task error:', err);
    return res.status(500).json({ error: 'Failed to create task' });
  }
}
