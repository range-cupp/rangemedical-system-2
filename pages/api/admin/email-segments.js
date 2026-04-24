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

// Fetch all rows from a query, paginating past Supabase's 1000-row default
async function fetchAll(queryBuilder) {
  const PAGE = 1000;
  let all = [];
  let offset = 0;
  while (true) {
    const { data, error } = await queryBuilder.range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

// Core segment query — builds dynamic Supabase query from filters
export async function querySegment(filters = {}) {
  const { protocolTypes, purchaseCategories, status, dateFrom, dateTo, minTotalSpend } = filters;
  const spendThreshold = Number(minTotalSpend) > 0 ? Number(minTotalSpend) : 0;

  // Start with patients who have email addresses
  let query = supabase
    .from('patients')
    .select('id, name, email, phone, created_at')
    .not('email', 'is', null)
    .neq('email', '')
    .order('name');

  // Filter by date range (patient created_at)
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo);

  const allPatients = await fetchAll(query);
  if (allPatients.length === 0) return [];

  // If no filters at all, return all patients with emails
  if ((!protocolTypes || protocolTypes.length === 0) &&
      (!purchaseCategories || purchaseCategories.length === 0) &&
      (!status || status === 'all') &&
      spendThreshold === 0) {
    return allPatients;
  }

  let matchingIds = null;

  // Filter by protocol types (uses program_type column)
  if (protocolTypes && protocolTypes.length > 0) {
    let protocolQuery = supabase
      .from('protocols')
      .select('patient_id')
      .in('program_type', protocolTypes);

    if (status && status !== 'all') {
      protocolQuery = protocolQuery.eq('status', status);
    }

    const protocols = await fetchAll(protocolQuery);
    matchingIds = new Set(protocols.map(p => p.patient_id));
  }

  // Filter by service log categories
  if (purchaseCategories && purchaseCategories.length > 0) {
    const logs = await fetchAll(
      supabase
        .from('service_logs')
        .select('patient_id')
        .in('category', purchaseCategories)
    );
    const logPatientIds = new Set(logs.map(l => l.patient_id));

    if (matchingIds) {
      // Intersect with protocol filter results
      matchingIds = new Set([...matchingIds].filter(id => logPatientIds.has(id)));
    } else {
      matchingIds = logPatientIds;
    }
  }

  // Filter by protocol status only (no type filter)
  if (status && status !== 'all' && (!protocolTypes || protocolTypes.length === 0)) {
    const statusProtos = await fetchAll(
      supabase
        .from('protocols')
        .select('patient_id')
        .eq('status', status)
    );
    const statusIds = new Set(statusProtos.map(p => p.patient_id));

    if (matchingIds) {
      matchingIds = new Set([...matchingIds].filter(id => statusIds.has(id)));
    } else {
      matchingIds = statusIds;
    }
  }

  // Filter by minimum lifetime spend (sum of purchases.amount_paid per patient)
  if (spendThreshold > 0) {
    const candidateIds = matchingIds
      ? Array.from(matchingIds)
      : allPatients.map(p => p.id);

    if (candidateIds.length === 0) {
      matchingIds = new Set();
    } else {
      // Chunk .in() to stay under Postgres parameter limits on large lists
      const CHUNK = 500;
      const totals = new Map();
      for (let i = 0; i < candidateIds.length; i += CHUNK) {
        const slice = candidateIds.slice(i, i + CHUNK);
        const rows = await fetchAll(
          supabase
            .from('purchases')
            .select('patient_id, amount_paid')
            .in('patient_id', slice)
        );
        for (const r of rows) {
          const amt = Number(r.amount_paid) || 0;
          totals.set(r.patient_id, (totals.get(r.patient_id) || 0) + amt);
        }
      }

      const highSpenders = new Set();
      for (const [pid, total] of totals) {
        if (total >= spendThreshold) highSpenders.add(pid);
      }

      matchingIds = matchingIds
        ? new Set([...matchingIds].filter(id => highSpenders.has(id)))
        : highSpenders;
    }
  }

  // Intersect with patients who have emails
  return allPatients.filter(p => matchingIds.has(p.id));
}
