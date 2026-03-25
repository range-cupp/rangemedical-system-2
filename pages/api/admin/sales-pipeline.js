// /pages/api/admin/sales-pipeline.js
// Sales Pipeline API — unified lead tracking before labs pipeline
// GET: returns board columns with leads grouped by stage
// PATCH: move a lead to a new stage
// POST: create a new manual lead or import from lead tables
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STAGES = [
  { key: 'new_lead', label: 'New Lead' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'follow_up', label: 'Follow-Up' },
  { key: 'booked', label: 'Booked' },
  { key: 'showed', label: 'Showed' },
  { key: 'started', label: 'Started' },
  { key: 'lost', label: 'Lost' },
];

export default async function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'PATCH') return handlePatch(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res) {
  const { action } = req.query;

  // Import existing leads that aren't already in the pipeline
  if (action === 'import') {
    return importLeads(res);
  }

  try {
    const { data: leads, error } = await supabase
      .from('sales_pipeline')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by stage
    const columns = STAGES.map(stage => ({
      key: stage.key,
      label: stage.label,
      leads: (leads || []).filter(l => l.stage === stage.key),
    }));

    const total = (leads || []).length;
    const active = (leads || []).filter(l => l.stage !== 'lost' && l.stage !== 'started').length;
    const converted = (leads || []).filter(l => l.stage === 'started').length;
    const lost = (leads || []).filter(l => l.stage === 'lost').length;

    return res.status(200).json({
      columns,
      stages: STAGES,
      summary: { total, active, converted, lost },
    });
  } catch (err) {
    console.error('Sales pipeline GET error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function handlePatch(req, res) {
  const { id, stage, notes, assigned_to, lost_reason } = req.body;

  if (!id || !stage) {
    return res.status(400).json({ error: 'id and stage are required' });
  }

  try {
    const updates = { stage, updated_at: new Date().toISOString() };
    if (notes !== undefined) updates.notes = notes;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (lost_reason !== undefined) updates.lost_reason = lost_reason;

    const { data, error } = await supabase
      .from('sales_pipeline')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Sales pipeline PATCH error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function handlePost(req, res) {
  const { first_name, last_name, email, phone, source, path, notes, lead_type, urgency } = req.body;

  if (!first_name) {
    return res.status(400).json({ error: 'first_name is required' });
  }

  try {
    const { data, error } = await supabase
      .from('sales_pipeline')
      .insert({
        first_name,
        last_name: last_name || '',
        email: email || '',
        phone: phone || '',
        source: source || 'manual',
        path: path || null,
        notes: notes || null,
        lead_type: lead_type || 'manual',
        urgency: urgency || null,
        stage: 'new_lead',
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error('Sales pipeline POST error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function importLeads(res) {
  let imported = 0;

  try {
    // Get existing lead_ids already in pipeline to avoid duplicates
    const { data: existing } = await supabase
      .from('sales_pipeline')
      .select('lead_id, lead_type')
      .not('lead_id', 'is', null);

    const existingKeys = new Set(
      (existing || []).map(e => `${e.lead_type}:${e.lead_id}`)
    );

    // Import assessment_leads
    const { data: assessments } = await supabase
      .from('assessment_leads')
      .select('id, first_name, last_name, email, phone, assessment_path, intake_status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    const assessmentRows = (assessments || [])
      .filter(a => !existingKeys.has(`assessment:${a.id}`))
      .map(a => ({
        lead_type: 'assessment',
        lead_id: a.id,
        first_name: a.first_name,
        last_name: a.last_name || '',
        email: a.email || '',
        phone: a.phone || '',
        source: 'assessment',
        path: a.assessment_path || null,
        stage: a.intake_status === 'complete' ? 'booked' : 'new_lead',
        created_at: a.created_at,
      }));

    // Import energy_check_leads
    const { data: energyChecks } = await supabase
      .from('energy_check_leads')
      .select('id, first_name, email, phone, primary_concern, status, severity, source, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    const statusMap = { new: 'new_lead', results_viewed: 'contacted', booked: 'booked' };
    const energyRows = (energyChecks || [])
      .filter(e => !existingKeys.has(`energy_check:${e.id}`))
      .map(e => ({
        lead_type: 'energy_check',
        lead_id: e.id,
        first_name: e.first_name,
        last_name: '',
        email: e.email || '',
        phone: e.phone || '',
        source: e.source || 'energy_check',
        path: 'energy',
        stage: statusMap[e.status] || 'new_lead',
        created_at: e.created_at,
      }));

    // Import start_leads
    const { data: startLeads } = await supabase
      .from('start_leads')
      .select('id, first_name, last_name, email, phone, path, main_concern, urgency, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    const startStatusMap = { new: 'new_lead', texted: 'contacted', booked: 'booked', showed: 'showed', started: 'started' };
    const startRows = (startLeads || [])
      .filter(s => !existingKeys.has(`start:${s.id}`))
      .map(s => ({
        lead_type: 'start',
        lead_id: s.id,
        first_name: s.first_name,
        last_name: s.last_name || '',
        email: s.email || '',
        phone: s.phone || '',
        source: 'start_funnel',
        path: s.path || null,
        urgency: s.urgency || null,
        notes: s.main_concern || null,
        stage: startStatusMap[s.status] || 'new_lead',
        created_at: s.created_at,
      }));

    const allRows = [...assessmentRows, ...energyRows, ...startRows];

    if (allRows.length > 0) {
      // Insert in batches of 50
      for (let i = 0; i < allRows.length; i += 50) {
        const batch = allRows.slice(i, i + 50);
        const { error } = await supabase.from('sales_pipeline').insert(batch);
        if (error) {
          console.error('Import batch error:', error.message);
        } else {
          imported += batch.length;
        }
      }
    }

    return res.status(200).json({ imported, total: allRows.length });
  } catch (err) {
    console.error('Import leads error:', err);
    return res.status(500).json({ error: err.message, imported });
  }
}

async function handleDelete(req, res) {
  const { id, ids } = req.body;

  // Support single delete or bulk delete
  const deleteIds = ids || (id ? [id] : []);
  if (deleteIds.length === 0) {
    return res.status(400).json({ error: 'id or ids required' });
  }

  try {
    const { error } = await supabase
      .from('sales_pipeline')
      .delete()
      .in('id', deleteIds);

    if (error) throw error;
    return res.status(200).json({ deleted: deleteIds.length });
  } catch (err) {
    console.error('Sales pipeline DELETE error:', err);
    return res.status(500).json({ error: err.message });
  }
}
