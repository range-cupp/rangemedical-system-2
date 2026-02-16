// /pages/api/admin/labs-pipeline.js
// API for Labs Pipeline - Protocol-based lab tracking
// Range Medical
// CREATED: 2026-01-26
// UPDATED: 2026-02-16 - Rebuilt to use protocols table with 5 stages

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Lab stages stored in protocols.status for program_type='labs'
const LAB_STAGES = ['blood_draw_complete', 'results_received', 'provider_reviewed', 'consult_scheduled', 'consult_complete'];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getLabsPipeline(req, res);
  } else if (req.method === 'PATCH') {
    return updateLabProtocol(req, res);
  } else if (req.method === 'POST') {
    return createLabProtocol(req, res);
  } else if (req.method === 'DELETE') {
    return deleteLabProtocol(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// GET: Fetch all lab protocols grouped by stage
async function getLabsPipeline(req, res) {
  try {
    // Fetch all lab protocols that are not completed or cancelled
    const { data: labProtocols, error } = await supabase
      .from('protocols')
      .select('id, patient_id, program_name, program_type, medication, status, notes, start_date, created_at, updated_at, delivery_method, patients(id, name, first_name, last_name, email, phone)')
      .eq('program_type', 'labs')
      .in('status', LAB_STAGES)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching lab protocols:', error);
      return res.status(500).json({ error: error.message });
    }

    // Group by stage (status field)
    const stages = {};
    for (const stage of LAB_STAGES) {
      stages[stage] = (labProtocols || []).filter(p => p.status === stage);
    }

    // Build counts
    const counts = {};
    for (const stage of LAB_STAGES) {
      counts[stage] = stages[stage].length;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return res.status(200).json({
      success: true,
      stages,
      counts,
      total
    });

  } catch (error) {
    console.error('Labs Pipeline Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// PATCH: Move a lab protocol to a different stage
async function updateLabProtocol(req, res) {
  try {
    const { id, newStage, notes } = req.body;

    if (!id || !newStage) {
      return res.status(400).json({ error: 'id and newStage required' });
    }

    if (!LAB_STAGES.includes(newStage)) {
      return res.status(400).json({ error: 'Invalid stage: ' + newStage });
    }

    const updates = {
      status: newStage,
      updated_at: new Date().toISOString()
    };

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', id)
      .eq('program_type', 'labs')
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Update Lab Protocol Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// DELETE: Remove a lab protocol
async function deleteLabProtocol(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id required' });
    }

    // Set to cancelled rather than hard delete
    const { error } = await supabase
      .from('protocols')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('program_type', 'labs');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Lab protocol removed' });

  } catch (error) {
    console.error('Delete Lab Protocol Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// POST: Manually create a lab protocol
async function createLabProtocol(req, res) {
  try {
    const { patientId, patientName, panelType, labType, bloodDrawDate, notes } = req.body;

    if (!patientName && !patientId) {
      return res.status(400).json({ error: 'patientName or patientId required' });
    }

    const panel = panelType || 'essential';
    const type = labType || 'new_patient';
    const programName = `${type === 'follow_up' ? 'Follow-up' : 'New Patient'} Labs - ${panel === 'elite' ? 'Elite' : 'Essential'}`;

    // Look up patient if we have a patientId
    let resolvedPatientId = patientId;
    let resolvedPatientName = patientName;

    if (patientId && !patientName) {
      const { data: patient } = await supabase
        .from('patients')
        .select('name, first_name, last_name')
        .eq('id', patientId)
        .single();
      if (patient) {
        resolvedPatientName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
      }
    }

    // If no patientId but we have a name, try to find patient
    if (!patientId && patientName) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name')
        .ilike('name', `%${patientName}%`)
        .limit(1);

      if (patients && patients.length > 0) {
        resolvedPatientId = patients[0].id;
        resolvedPatientName = patients[0].name;
      }
    }

    const insertData = {
      patient_id: resolvedPatientId || null,
      program_name: programName,
      program_type: 'labs',
      medication: panel === 'elite' ? 'Elite' : 'Essential',
      delivery_method: type,
      status: 'blood_draw_complete',
      start_date: bloodDrawDate || new Date().toISOString().split('T')[0],
      notes: notes || null
    };

    const { data, error } = await supabase
      .from('protocols')
      .insert(insertData)
      .select('*, patients(id, name, first_name, last_name, email, phone)')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Create Lab Protocol Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
