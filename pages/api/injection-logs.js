// /pages/api/injection-logs.js
// API for injection logs CRUD operations
// Range Medical
// UPDATED: 2026-01-14 - Links to protocols, deduped patients

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getInjectionLogs(req, res);
    case 'POST':
      return createInjectionLog(req, res);
    case 'DELETE':
      return deleteInjectionLog(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// GET - Fetch injection logs OR patients for dropdown
async function getInjectionLogs(req, res) {
  try {
    const { category, patient_id, limit = 100, patients_for } = req.query;

    // If requesting patients for a specific category, return deduped list
    if (patients_for) {
      return getPatientsForCategory(patients_for, res);
    }

    let query = supabase
      .from('injection_logs')
      .select('*')
      .order('logged_at', { ascending: false })
      .limit(parseInt(limit));

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Filter by patient if provided
    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching injection logs:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ logs: data || [] });
  } catch (err) {
    console.error('Error in getInjectionLogs:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Get patients with active protocols for a category
async function getPatientsForCategory(category, res) {
  try {
    // Map category to program_type
    const programTypeMap = {
      'testosterone': 'hrt',
      'weight_loss': 'weight_loss',
      'vitamin': 'injection'
    };
    
    const programType = programTypeMap[category];
    
    // Get patients with active protocols in this category
    const { data, error } = await supabase
      .from('protocols')
      .select(`
        patient_id,
        patients!inner (
          id,
          name,
          ghl_contact_id
        )
      `)
      .eq('program_type', programType)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patients for category:', error);
      return res.status(500).json({ error: error.message });
    }

    // Dedupe by ghl_contact_id, keeping the first occurrence
    const seen = new Set();
    const uniquePatients = [];
    
    for (const row of (data || [])) {
      const patient = row.patients;
      if (!patient) continue;
      
      const key = patient.ghl_contact_id || patient.id;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePatients.push({
          id: patient.id,
          name: patient.name,
          ghl_contact_id: patient.ghl_contact_id
        });
      }
    }

    // Sort alphabetically by name
    uniquePatients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return res.status(200).json({ patients: uniquePatients });
  } catch (err) {
    console.error('Error in getPatientsForCategory:', err);
    return res.status(500).json({ error: err.message });
  }
}

// POST - Create new injection log linked to protocol
async function createInjectionLog(req, res) {
  try {
    const {
      patient_id,
      patient_name,
      log_type,
      category,
      hrt_type,
      medication,
      dosage,
      pickup_type,
      quantity,
      notes,
      logged_at
    } = req.body;

    // Validate required fields
    if (!patient_id || !patient_name) {
      return res.status(400).json({ error: 'Patient is required' });
    }

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Map category to program_type
    const programTypeMap = {
      'testosterone': 'hrt',
      'weight_loss': 'weight_loss',
      'vitamin': 'injection'
    };
    
    const programType = programTypeMap[category];

    // Find the patient's active protocol for this category
    const { data: protocols, error: protocolError } = await supabase
      .from('protocols')
      .select('id')
      .eq('patient_id', patient_id)
      .eq('program_type', programType)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (protocolError) {
      console.error('Error finding protocol:', protocolError);
    }

    const protocolId = protocols?.[0]?.id || null;

    // Build medication string for testosterone
    let finalMedication = medication;
    if (category === 'testosterone' && !medication) {
      finalMedication = hrt_type === 'female' 
        ? 'Testosterone Cypionate 100mg/ml' 
        : 'Testosterone Cypionate 200mg/ml';
    }

    const logEntry = {
      patient_id,
      patient_name,
      protocol_id: protocolId,
      log_type: log_type || 'injection',
      category,
      hrt_type: category === 'testosterone' ? (hrt_type || 'male') : null,
      medication: finalMedication,
      dosage,
      pickup_type: log_type === 'pickup' ? pickup_type : null,
      quantity: log_type === 'pickup' ? quantity : null,
      notes: notes || null,
      logged_at: logged_at ? new Date(logged_at).toISOString() : new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('injection_logs')
      .insert([logEntry])
      .select()
      .single();

    if (error) {
      console.error('Error creating injection log:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ success: true, log: data, protocol_id: protocolId });
  } catch (err) {
    console.error('Error in createInjectionLog:', err);
    return res.status(500).json({ error: err.message });
  }
}

// DELETE - Delete injection log
async function deleteInjectionLog(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Log ID is required' });
    }

    const { error } = await supabase
      .from('injection_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting injection log:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error in deleteInjectionLog:', err);
    return res.status(500).json({ error: err.message });
  }
}
