// /pages/api/admin/email-segments.js
// Segment patients by protocol type, purchase history, status
// Returns matching patients with email addresses for campaign targeting

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') return previewSegment(req, res);
  if (req.method === 'GET') return listSegments(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

// Preview segment — returns patients matching filters
async function previewSegment(req, res) {
  try {
    const { filters } = req.body;
    const patients = await querySegment(filters);
    return res.json({ patients, count: patients.length });
  } catch (err) {
    console.error('Segment preview error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// List saved segments
async function listSegments(req, res) {
  try {
    const { data, error } = await supabase
      .from('email_segments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ segments: data || [] });
  } catch (err) {
    console.error('List segments error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Core segment query — builds dynamic Supabase query from filters
export async function querySegment(filters = {}) {
  const { protocolTypes, purchaseCategories, status, dateFrom, dateTo, hasEmail } = filters;

  // Start with patients who have email addresses
  let query = supabase
    .from('patients')
    .select('id, name, email, phone, created_at')
    .not('email', 'is', null)
    .neq('email', '');

  // Filter by date range (patient created_at)
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo);

  const { data: allPatients, error } = await query.order('name');
  if (error) throw error;
  if (!allPatients || allPatients.length === 0) return [];

  const patientIds = allPatients.map(p => p.id);

  // If no protocol/purchase filters, return all patients with emails
  if ((!protocolTypes || protocolTypes.length === 0) && (!purchaseCategories || purchaseCategories.length === 0) && !status) {
    return allPatients;
  }

  let matchingIds = new Set(patientIds);

  // Filter by protocol types
  if (protocolTypes && protocolTypes.length > 0) {
    let protocolQuery = supabase
      .from('protocols')
      .select('patient_id, type, status')
      .in('patient_id', patientIds)
      .in('type', protocolTypes);

    if (status && status !== 'all') {
      protocolQuery = protocolQuery.eq('status', status);
    }

    const { data: protocols, error: pErr } = await protocolQuery;
    if (pErr) throw pErr;

    const protocolPatientIds = new Set((protocols || []).map(p => p.patient_id));
    matchingIds = protocolPatientIds;
  }

  // Filter by purchase/service log categories
  if (purchaseCategories && purchaseCategories.length > 0) {
    const { data: logs, error: lErr } = await supabase
      .from('service_logs')
      .select('patient_id, category')
      .in('patient_id', patientIds)
      .in('category', purchaseCategories);
    if (lErr) throw lErr;

    const logPatientIds = new Set((logs || []).map(l => l.patient_id));

    // If we also have protocol filters, intersect; otherwise use log results
    if (protocolTypes && protocolTypes.length > 0) {
      matchingIds = new Set([...matchingIds].filter(id => logPatientIds.has(id)));
    } else {
      matchingIds = logPatientIds;
    }
  }

  // Filter by protocol status only (no type filter)
  if (status && status !== 'all' && (!protocolTypes || protocolTypes.length === 0)) {
    const { data: statusProtos, error: sErr } = await supabase
      .from('protocols')
      .select('patient_id')
      .in('patient_id', patientIds)
      .eq('status', status);
    if (sErr) throw sErr;

    const statusIds = new Set((statusProtos || []).map(p => p.patient_id));
    matchingIds = new Set([...matchingIds].filter(id => statusIds.has(id)));
  }

  return allPatients.filter(p => matchingIds.has(p.id));
}
