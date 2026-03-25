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
  if (t.includes('peptide') || t.includes('recovery') || t.includes('bpc') || t.includes('month_program') || t.includes('jumpstart') || t.includes('maintenance_4week') || t.includes('gh_peptide')) return 'peptide';
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

  // Group by patient_id -> Set of categories + count
  const programMap = {};
  const protocolCountMap = {};
  for (const p of allProtocols) {
    const cat = getCategory(p.program_type);
    if (cat) {
      if (!programMap[p.patient_id]) programMap[p.patient_id] = new Set();
      programMap[p.patient_id].add(cat);
    }
    protocolCountMap[p.patient_id] = (protocolCountMap[p.patient_id] || 0) + 1;
  }

  // Attach to patients
  return patients.map(patient => ({
    ...patient,
    activePrograms: programMap[patient.id] ? [...programMap[patient.id]] : [],
    activeProtocolCount: protocolCountMap[patient.id] || 0,
  }));
}

// Batch fetch last visit dates from service_logs
async function attachLastVisits(patients) {
  if (!patients.length) return patients;

  // Use a raw SQL query to get max entry_date per patient efficiently
  const { data, error } = await supabase.rpc('get_patient_last_visits');

  if (error || !data) {
    // Fallback: fetch recent service logs and compute in JS
    let allLogs = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: batch, error: batchErr } = await supabase
        .from('service_logs')
        .select('patient_id, entry_date')
        .order('entry_date', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (batchErr || !batch || batch.length === 0) {
        hasMore = false;
      } else {
        allLogs = allLogs.concat(batch);
        from += PAGE_SIZE;
        hasMore = batch.length === PAGE_SIZE;
      }
    }

    const lastVisitMap = {};
    for (const log of allLogs) {
      if (!lastVisitMap[log.patient_id] || log.entry_date > lastVisitMap[log.patient_id]) {
        lastVisitMap[log.patient_id] = log.entry_date;
      }
    }

    return patients.map(p => ({
      ...p,
      lastVisit: lastVisitMap[p.id] || null,
    }));
  }

  const visitMap = {};
  for (const row of data) {
    visitMap[row.patient_id] = row.last_visit;
  }
  return patients.map(p => ({
    ...p,
    lastVisit: visitMap[p.id] || null,
  }));
}

// Batch fetch lab status per patient (most recent lab)
async function attachLabStatus(patients) {
  if (!patients.length) return patients;

  let allLabs = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('labs')
      .select('patient_id, lab_date, results, pdf_url')
      .order('lab_date', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error || !batch || batch.length === 0) {
      hasMore = false;
    } else {
      allLabs = allLabs.concat(batch);
      from += PAGE_SIZE;
      hasMore = batch.length === PAGE_SIZE;
    }
  }

  // Keep only most recent lab per patient
  const labMap = {};
  for (const lab of allLabs) {
    if (!labMap[lab.patient_id] || lab.lab_date > labMap[lab.patient_id].lab_date) {
      labMap[lab.patient_id] = lab;
    }
  }

  return patients.map(p => {
    const lab = labMap[p.id];
    let labStatus = null;
    if (lab) {
      const hasResults = lab.results && Object.keys(lab.results).length > 0;
      const hasPdf = !!lab.pdf_url;
      if (hasResults || hasPdf) {
        labStatus = 'results_ready';
      } else {
        labStatus = 'pending';
      }
    }
    return { ...p, labStatus, lastLabDate: lab?.lab_date || null };
  });
}

// Derive patient status from visit history
function derivePatientStatus(patients) {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const ninetyDaysStr = ninetyDaysAgo.toISOString().split('T')[0];

  return patients.map(p => {
    let patientStatus = 'new'; // no visits
    if (p.lastVisit) {
      patientStatus = p.lastVisit >= ninetyDaysStr ? 'active' : 'inactive';
    }
    return { ...p, patientStatus };
  });
}

export default async function handler(req, res) {
  // ── POST: Create a new patient ──
  if (req.method === 'POST') {
    try {
      const { first_name, last_name, email, phone, date_of_birth } = req.body;

      if (!first_name || !last_name) {
        return res.status(400).json({ error: 'First name and last name are required' });
      }

      const name = `${first_name.trim()} ${last_name.trim()}`;
      const patientData = {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        name,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        date_of_birth: date_of_birth || null,
        tags: ['walk-in'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check for duplicate email if provided
      if (patientData.email) {
        const { data: existing } = await supabase
          .from('patients')
          .select('id, name')
          .eq('email', patientData.email)
          .maybeSingle();

        if (existing) {
          return res.status(409).json({
            error: `A patient with email ${patientData.email} already exists (${existing.name})`,
            existingId: existing.id
          });
        }
      }

      const { data: newPatient, error: insertError } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating patient:', insertError);
        return res.status(500).json({ error: insertError.message });
      }

      return res.status(201).json(newPatient);
    } catch (error) {
      console.error('Create patient error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // ── GET: Fetch patients ──
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
      let enriched = await attachActivePrograms(patients || []);
      enriched = await attachLastVisits(enriched);
      enriched = await attachLabStatus(enriched);
      enriched = derivePatientStatus(enriched);
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

    let enriched = await attachActivePrograms(allPatients);
    enriched = await attachLastVisits(enriched);
    enriched = await attachLabStatus(enriched);
    enriched = derivePatientStatus(enriched);
    return res.status(200).json(enriched);

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
