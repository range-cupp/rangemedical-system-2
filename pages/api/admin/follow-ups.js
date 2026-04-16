// /pages/api/admin/follow-ups.js
// CRUD API for Follow-Up Hub
// GET: list follow-ups (queue/leads/inactive tabs), with filters
// POST: create manual follow-up or log an attempt
// PATCH: update follow-up (status, assign, snooze, resolve)
// DELETE: delete follow-up
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../lib/auth';

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
  const { tab = 'queue', type, assigned_to, priority, status, follow_up_id } = req.query;

  // ── LOGS: fetch attempt log for a specific follow-up ──
  if (tab === 'logs' && follow_up_id) {
    const { data, error } = await supabase
      .from('follow_up_log')
      .select('*')
      .eq('follow_up_id', follow_up_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  // ── QUEUE TAB: active follow-up items ──
  if (tab === 'queue') {
    let query = supabase
      .from('follow_ups')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false });

    // Default: show pending + in_progress, hide snoozed
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['pending', 'in_progress']);
    }

    if (type) query = query.eq('type', type);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (priority) query = query.eq('priority', priority);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Filter out snoozed items that haven't reached their snooze date
    const todayStr = new Date().toISOString().split('T')[0];
    const filtered = (data || []).filter(f =>
      !f.snoozed_until || f.snoozed_until <= todayStr || f.status !== 'snoozed'
    );

    // Sort: overdue first, then by priority rank, then by due_date
    const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => {
      const aOverdue = a.due_date && a.due_date < todayStr ? 1 : 0;
      const bOverdue = b.due_date && b.due_date < todayStr ? 1 : 0;
      if (bOverdue !== aOverdue) return bOverdue - aOverdue; // overdue first
      const aPri = priorityRank[a.priority] ?? 2;
      const bPri = priorityRank[b.priority] ?? 2;
      if (aPri !== bPri) return aPri - bPri;
      return (a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1;
    });

    // Enrich with employee names
    const employeeIds = [...new Set(filtered.map(f => f.assigned_to).filter(Boolean))];
    let employeeMap = {};
    if (employeeIds.length > 0) {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name')
        .in('id', employeeIds);
      if (employees) {
        employeeMap = Object.fromEntries(employees.map(e => [e.id, e.name]));
      }
    }

    const enriched = filtered.map(f => ({
      ...f,
      assigned_to_name: f.assigned_to ? (employeeMap[f.assigned_to] || null) : null,
    }));

    return res.status(200).json(enriched);
  }

  // ── LEADS TAB: sales pipeline entries ──
  if (tab === 'leads') {
    const { data, error } = await supabase
      .from('sales_pipeline')
      .select('*')
      .not('stage', 'in', '("started","lost")')
      .order('urgency', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  // ── INACTIVE TAB: patients with no active protocols, last visit 60+ days ago ──
  if (tab === 'inactive') {
    // Get all patients who have at least one completed protocol
    const { data: completedProts } = await supabase
      .from('protocols')
      .select('patient_id, patient_name')
      .eq('status', 'completed');

    if (!completedProts) return res.status(200).json([]);

    // Deduplicate
    const patientMap = {};
    for (const p of completedProts) {
      if (!patientMap[p.patient_id]) {
        patientMap[p.patient_id] = p.patient_name;
      }
    }
    const patientIds = Object.keys(patientMap);
    if (patientIds.length === 0) return res.status(200).json([]);

    // Filter out those with active protocols
    const { data: activeProts } = await supabase
      .from('protocols')
      .select('patient_id')
      .eq('status', 'active')
      .in('patient_id', patientIds);

    const activePatientIds = new Set((activeProts || []).map(p => p.patient_id));
    const inactiveIds = patientIds.filter(id => !activePatientIds.has(id));
    if (inactiveIds.length === 0) return res.status(200).json([]);

    // Get last service log for each
    const results = [];
    // Process in batches to avoid query limits
    for (const patientId of inactiveIds) {
      const { data: lastLog } = await supabase
        .from('service_logs')
        .select('entry_date')
        .eq('patient_id', patientId)
        .order('entry_date', { ascending: false })
        .limit(1);

      const lastVisit = lastLog?.[0]?.entry_date || null;
      const daysSince = lastVisit
        ? Math.floor((new Date() - new Date(lastVisit + 'T00:00:00')) / (1000 * 60 * 60 * 24))
        : null;

      // Only show if 60+ days since last visit (or never visited)
      if (daysSince === null || daysSince >= 60) {
        // Get their most recent completed protocol
        const { data: lastProt } = await supabase
          .from('protocols')
          .select('program_name, program_type, end_date')
          .eq('patient_id', patientId)
          .eq('status', 'completed')
          .order('end_date', { ascending: false })
          .limit(1);

        results.push({
          patient_id: patientId,
          patient_name: patientMap[patientId] || 'Unknown',
          last_visit: lastVisit,
          days_since_visit: daysSince,
          last_protocol: lastProt?.[0]?.program_name || null,
          last_protocol_type: lastProt?.[0]?.program_type || null,
          last_protocol_end: lastProt?.[0]?.end_date || null,
        });
      }
    }

    // Sort by most recent visit first (null = never visited, goes last)
    results.sort((a, b) => {
      if (!a.last_visit && !b.last_visit) return 0;
      if (!a.last_visit) return 1;
      if (!b.last_visit) return -1;
      return b.last_visit > a.last_visit ? 1 : -1;
    });

    return res.status(200).json(results);
  }

  return res.status(400).json({ error: 'Invalid tab' });
}

async function handlePost(req, res, employee) {
  const { action } = req.body;

  // ── LOG AN ATTEMPT ──
  if (action === 'log') {
    const { follow_up_id, log_action, notes } = req.body;
    if (!follow_up_id || !log_action) {
      return res.status(400).json({ error: 'follow_up_id and log_action required' });
    }

    const { error: logError } = await supabase.from('follow_up_log').insert({
      follow_up_id,
      action: log_action,
      notes: notes || null,
      logged_by: employee.id,
      logged_by_name: employee.name,
    });

    if (logError) return res.status(500).json({ error: logError.message });

    // Move follow-up to in_progress if it was pending
    await supabase
      .from('follow_ups')
      .update({ status: 'in_progress' })
      .eq('id', follow_up_id)
      .eq('status', 'pending');

    // If the action is a resolving action, complete the follow-up
    const resolvingActions = ['scheduled', 'renewed'];
    if (resolvingActions.includes(log_action)) {
      await supabase
        .from('follow_ups')
        .update({
          status: 'completed',
          outcome: log_action,
          outcome_notes: notes || null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', follow_up_id);
    }

    return res.status(200).json({ success: true });
  }

  // ── CREATE MANUAL FOLLOW-UP ──
  const { patient_id, patient_name, protocol_id, trigger_reason, priority, assigned_to, due_date } = req.body;
  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id required' });
  }

  const { data, error } = await supabase.from('follow_ups').insert({
    patient_id,
    patient_name: patient_name || null,
    protocol_id: protocol_id || null,
    type: 'custom',
    trigger_reason: trigger_reason || 'Manual follow-up',
    status: 'pending',
    priority: priority || 'medium',
    assigned_to: assigned_to || null,
    due_date: due_date || new Date().toISOString().split('T')[0],
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}

async function handlePatch(req, res, employee) {
  const { id, status, assigned_to, priority, snoozed_until, outcome, outcome_notes } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });

  const updates = {};
  if (status !== undefined) updates.status = status;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;
  if (priority !== undefined) updates.priority = priority;
  if (snoozed_until !== undefined) {
    updates.snoozed_until = snoozed_until;
    updates.status = 'snoozed';
  }
  if (outcome !== undefined) {
    updates.outcome = outcome;
    updates.outcome_notes = outcome_notes || null;
    updates.status = 'completed';
    updates.completed_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  const { error } = await supabase
    .from('follow_ups')
    .update(updates)
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function handleDelete(req, res, employee) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  const { error } = await supabase
    .from('follow_ups')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

