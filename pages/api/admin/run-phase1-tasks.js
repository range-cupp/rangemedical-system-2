// /pages/api/admin/run-phase1-tasks.js
// One-time utility: create Phase 1 review tasks for Evan + Dr. Burgess
// for all labs imported on a given date (defaults to today).
// Protected by ADMIN_PASSWORD.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { password, date } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // 1. Find all lab protocols created on the target date with status = results_received
    const { data: protocols, error: protoErr } = await supabase
      .from('protocols')
      .select('id, patient_id, program_name, created_at, patients(id, name, first_name, last_name)')
      .eq('program_type', 'labs')
      .eq('status', 'results_received')
      .gte('created_at', `${targetDate}T00:00:00.000Z`)
      .lte('created_at', `${targetDate}T23:59:59.999Z`);

    if (protoErr) return res.status(500).json({ error: protoErr.message });

    if (!protocols || protocols.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No results_received lab protocols found for ${targetDate}`,
        tasksCreated: 0
      });
    }

    // 2. Look up Evan + Dr. Burgess IDs
    const { data: staff, error: staffErr } = await supabase
      .from('employees')
      .select('id, email, name')
      .in('email', ['evan@range-medical.com', 'burgess@range-medical.com']);

    if (staffErr) return res.status(500).json({ error: staffErr.message });

    const evanId    = staff?.find(e => e.email === 'evan@range-medical.com')?.id    || null;
    const burgessId = staff?.find(e => e.email === 'burgess@range-medical.com')?.id || null;

    if (!evanId && !burgessId) {
      return res.status(500).json({ error: 'Neither Evan nor Burgess found in employees table' });
    }

    // 3. Due date: 2 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    const due = dueDate.toISOString().split('T')[0];

    // 4. Build tasks
    const tasks = [];
    const summary = [];

    for (const proto of protocols) {
      const pt = proto.patients;
      const patientName = pt
        ? (pt.name || `${pt.first_name || ''} ${pt.last_name || ''}`.trim())
        : proto.patient_id;

      summary.push(patientName);

      const base = {
        title: `🔬 Review labs — ${patientName}`,
        description: `New lab results have been imported for ${patientName}. Please review before scheduling a patient consult.`,
        patient_id: proto.patient_id || null,
        patient_name: patientName,
        priority: 'high',
        due_date: due,
        status: 'pending',
        category: 'labs',
      };

      if (evanId)    tasks.push({ ...base, assigned_to: evanId,    assigned_by: evanId });
      if (burgessId) tasks.push({ ...base, assigned_to: burgessId, assigned_by: burgessId });
    }

    // 5. Insert
    const { data: inserted, error: insertErr } = await supabase
      .from('tasks')
      .insert(tasks)
      .select('id, title, assigned_to');

    if (insertErr) return res.status(500).json({ error: insertErr.message });

    return res.status(200).json({
      success: true,
      date: targetDate,
      patientsFound: protocols.length,
      patients: summary,
      tasksCreated: inserted.length,
      tasks: inserted,
      staff: { evanId, burgessId }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
