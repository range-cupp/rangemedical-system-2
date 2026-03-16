// /pages/api/admin/tasks.js
// CRUD API for internal staff tasks
// GET: list tasks (filter by assigned_to, status, all)
// POST: create task
// PATCH: update task (toggle complete, edit)
// DELETE: delete task
// Range Medical System

import { createClient } from '@supabase/supabase-js';
import { requireAuth, logAction } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  if (req.method === 'GET') return handleGet(req, res, employee);
  if (req.method === 'POST') return handlePost(req, res, employee);
  if (req.method === 'PATCH') return handlePatch(req, res, employee);
  if (req.method === 'DELETE') return handleDelete(req, res, employee);

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res, employee) {
  const { filter = 'my', status: statusFilter } = req.query;

  let query = supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  // Filter by view
  if (filter === 'my') {
    query = query.eq('assigned_to', employee.id);
  } else if (filter === 'assigned') {
    query = query.eq('assigned_by', employee.id).neq('assigned_to', employee.id);
  }
  // 'all' = no assignee filter

  // Filter by status
  if (statusFilter === 'pending') {
    query = query.eq('status', 'pending');
  } else if (statusFilter === 'completed') {
    query = query.eq('status', 'completed');
  }

  const { data, error } = await query.limit(200);

  if (error) {
    console.error('List tasks error:', error);
    return res.status(500).json({ error: error.message });
  }

  // Enrich with employee names
  const employeeIds = [...new Set([
    ...data.map(t => t.assigned_to),
    ...data.map(t => t.assigned_by),
  ])];

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name')
    .in('id', employeeIds);

  const empMap = {};
  (employees || []).forEach(e => { empMap[e.id] = e.name; });

  // Enrich with patient phone numbers
  const patientIds = [...new Set(data.filter(t => t.patient_id).map(t => t.patient_id))];
  const patientPhoneMap = {};
  if (patientIds.length > 0) {
    const { data: patients } = await supabase
      .from('patients')
      .select('id, phone')
      .in('id', patientIds);
    (patients || []).forEach(p => { patientPhoneMap[p.id] = p.phone; });
  }

  const tasks = data.map(t => ({
    ...t,
    assigned_to_name: empMap[t.assigned_to] || 'Unknown',
    assigned_by_name: empMap[t.assigned_by] || 'Unknown',
    patient_phone: t.patient_id ? (patientPhoneMap[t.patient_id] || null) : null,
  }));

  return res.status(200).json({ tasks });
}

async function handlePost(req, res, employee) {
  const { title, description, assigned_to, patient_id, patient_name, priority, due_date } = req.body;

  if (!title || !assigned_to) {
    return res.status(400).json({ error: 'title and assigned_to are required' });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description: description || null,
      assigned_to,
      assigned_by: employee.id,
      patient_id: patient_id || null,
      patient_name: patient_name || null,
      priority: priority || 'medium',
      due_date: due_date || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: error.message });
  }

  await logAction({
    employeeId: employee.id,
    employeeName: employee.name,
    action: 'create_task',
    resourceType: 'task',
    resourceId: data.id,
    details: { title, assigned_to, priority },
    req,
  });

  return res.status(201).json({ success: true, task: data });
}

async function handlePatch(req, res, employee) {
  const { id, status, title, description, priority, due_date, assigned_to } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const updateData = { updated_at: new Date().toISOString() };
  if (status !== undefined) {
    updateData.status = status;
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'pending') {
      updateData.completed_at = null;
    }
  }
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (priority !== undefined) updateData.priority = priority;
  if (due_date !== undefined) updateData.due_date = due_date || null;
  if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: error.message });
  }

  await logAction({
    employeeId: employee.id,
    employeeName: employee.name,
    action: status === 'completed' ? 'complete_task' : 'update_task',
    resourceType: 'task',
    resourceId: id,
    details: updateData,
    req,
  });

  return res.status(200).json({ success: true, task: data });
}

async function handleDelete(req, res, employee) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'id query parameter is required' });
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: error.message });
  }

  await logAction({
    employeeId: employee.id,
    employeeName: employee.name,
    action: 'delete_task',
    resourceType: 'task',
    resourceId: id,
    details: {},
    req,
  });

  return res.status(200).json({ success: true });
}
