// /pages/api/admin/patients.js
// Patients List API - Range Medical
// Returns all patients with active program tags
// Uses pagination to bypass Supabase's 1000-row limit

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PAGE_SIZE = 1000; // Supabase max per query

// Map program_type to a normalized category key
function getCategory(programType) {
  if (!programType) return null;
  const t = programType.toLowerCase();
  if (t.includes('hrt')) return 'hrt';
  if (t.includes('weight_loss') || t.includes('weight loss')) return 'weight_loss';
  if (t.includes('peptide')) return 'peptide';
  if (t.includes('iv') || t === 'iv_therapy') return 'iv';
  if (t.includes('hbot')) return 'hbot';
  if (t.includes('rlt') || t.includes('red_light')) return 'rlt';
  if (t.includes('injection')) return 'injection';
  return null;
}

// Attach activePrograms to each patient based on their protocols
async function attachActivePrograms(patients) {
  if (!patients.length) return patients;

  // Batch fetch all active protocols (non-completed, non-cancelled)
  let allProtocols = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('protocols')
      .select('patient_id, program_type, status')
      .not('status', 'in', '("completed","cancelled")')
      .range(from, from + PAGE_SIZE - 1);

    if (error || !batch || batch.length === 0) {
      hasMore = false;
    } else {
      allProtocols = allProtocols.concat(batch);
      from += PAGE_SIZE;
      hasMore = batch.length === PAGE_SIZE;
    }
  }

  // Group by patient_id -> Set of categories
  const programMap = {};
  for (const p of allProtocols) {
    const cat = getCategory(p.program_type);
    if (cat) {
      if (!programMap[p.patient_id]) programMap[p.patient_id] = new Set();
      programMap[p.patient_id].add(cat);
    }
  }

  // Attach to patients
  return patients.map(patient => ({
    ...patient,
    activePrograms: programMap[patient.id] ? [...programMap[patient.id]] : [],
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search, id } = req.query;

    // Direct lookup by ID
    if (id) {
      const { data: patient, error: idError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (idError) {
        return res.status(500).json({ error: 'Failed to fetch patient' });
      }
      return res.status(200).json(patient ? [patient] : []);
    }

    // If searching, a single query is fine (results will be < 1000)
    if (search) {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,ghl_contact_id.eq.${search}`)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        console.error('Error fetching patients:', error);
        return res.status(500).json({ error: 'Failed to fetch patients' });
      }
      const enriched = await attachActivePrograms(patients || []);
      return res.status(200).json(enriched);
    }

    // No search — fetch ALL patients using pagination to bypass 1000-row cap
    let allPatients = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('Error fetching patients batch:', error);
        return res.status(500).json({ error: 'Failed to fetch patients' });
      }

      if (batch && batch.length > 0) {
        allPatients = allPatients.concat(batch);
        from += PAGE_SIZE;
        hasMore = batch.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    const enriched = await attachActivePrograms(allPatients);
    return res.status(200).json(enriched);

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
