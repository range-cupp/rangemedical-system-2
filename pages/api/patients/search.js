// /pages/api/patients/search.js
// Patient Search API — returns patient info with active programs and status
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ error: 'Query must be at least 2 characters' });

    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, name, email, phone, date_of_birth, gender, profile_photo_url')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
      .order('name')
      .limit(20);

    if (error) return res.status(500).json({ error: 'Search failed' });
    if (!patients || patients.length === 0) return res.status(200).json({ patients: [] });

    const patientIds = patients.map(p => p.id);

    const [protocolRes, serviceLogRes] = await Promise.all([
      supabase
        .from('protocols')
        .select('patient_id, program_type, status')
        .in('patient_id', patientIds)
        .not('status', 'in', '("completed","cancelled")'),
      supabase
        .from('service_logs')
        .select('patient_id, service_date')
        .in('patient_id', patientIds)
        .order('service_date', { ascending: false }),
    ]);

    const programMap = {};
    if (protocolRes.data) {
      for (const p of protocolRes.data) {
        const cat = getCategory(p.program_type);
        if (cat) {
          if (!programMap[p.patient_id]) programMap[p.patient_id] = new Set();
          programMap[p.patient_id].add(cat);
        }
      }
    }

    const lastVisitMap = {};
    if (serviceLogRes.data) {
      for (const s of serviceLogRes.data) {
        if (!lastVisitMap[s.patient_id]) lastVisitMap[s.patient_id] = s.service_date;
      }
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const enriched = patients.map(p => {
      let patientStatus = 'new';
      const lastVisit = lastVisitMap[p.id];
      if (lastVisit) {
        patientStatus = lastVisit >= ninetyDaysAgo ? 'active' : 'inactive';
      }
      return {
        ...p,
        activePrograms: programMap[p.id] ? [...programMap[p.id]] : [],
        patientStatus,
        lastVisit: lastVisit || null,
      };
    });

    return res.status(200).json({ patients: enriched });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
