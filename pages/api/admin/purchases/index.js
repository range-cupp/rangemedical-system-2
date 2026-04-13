// /pages/api/admin/purchases/index.js
// Purchases API - No auth required (internal use)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET - List purchases
  if (req.method === 'GET') {
    const { category, search, days, limit, source, patient_id } = req.query;

    try {
      // Helper to build query with all filters
      const buildQuery = () => {
        let q = supabase
          .from('purchases')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (patient_id) q = q.eq('patient_id', patient_id);
        if (category && category !== 'All') q = q.eq('category', category);
        if (source) q = q.eq('source', source);
        if (days && days !== 'all') {
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - parseInt(days));
          q = q.gte('created_at', daysAgo.toISOString());
        }
        if (search) {
          q = q.or(`patient_name.ilike.%${search}%,item_name.ilike.%${search}%,patient_email.ilike.%${search}%`);
        }
        return q;
      };

      // If a hard limit is set (e.g., recent purchases widget), use a single query
      const hardLimit = limit ? parseInt(limit) : null;

      // Paginate to bypass Supabase 1000-row cap
      const PAGE_SIZE = 1000;
      let allPurchases = [];
      let from = 0;
      let hasMore = true;
      let totalCount = null;

      if (hardLimit && hardLimit <= PAGE_SIZE) {
        // Single query with limit — fast path
        const { data, error, count } = await buildQuery().limit(hardLimit);
        if (error) {
          console.error('Purchases fetch error:', error);
          return res.status(500).json({ error: 'Failed to fetch purchases', details: error.message });
        }
        allPurchases = data || [];
        totalCount = count;
      } else {
        while (hasMore) {
          const { data: batch, error, count } = await buildQuery().range(from, from + PAGE_SIZE - 1);

          if (error) {
            console.error('Purchases fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch purchases', details: error.message });
          }

          if (totalCount === null) totalCount = count;

          if (batch && batch.length > 0) {
            allPurchases = allPurchases.concat(batch);
            from += PAGE_SIZE;
            hasMore = batch.length === PAGE_SIZE;
            if (hardLimit && allPurchases.length >= hardLimit) {
              allPurchases = allPurchases.slice(0, hardLimit);
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
      }

      const total = totalCount || allPurchases.length;
      const revenue = allPurchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      // Fetch active protocols for patients with unlinked purchases
      // This prevents showing "Create" when a protocol already exists
      let activeProtocolsByPatient = {};
      try {
        const unlinkedWithPatientId = allPurchases.filter(p => !p.protocol_id && !p.session_logged && p.patient_id);
        const patientIds = [...new Set(unlinkedWithPatientId.map(p => p.patient_id))];

        if (patientIds.length > 0) {
          // Batch in chunks of 100 to avoid query limits
          for (let i = 0; i < patientIds.length; i += 100) {
            const batch = patientIds.slice(i, i + 100);
            const { data: protocols } = await supabase
              .from('protocols')
              .select('id, patient_id, patient_name, program_type, program_name, medication, status')
              .in('patient_id', batch)
              .eq('status', 'active');

            if (protocols) {
              for (const p of protocols) {
                if (!activeProtocolsByPatient[p.patient_id]) {
                  activeProtocolsByPatient[p.patient_id] = [];
                }
                activeProtocolsByPatient[p.patient_id].push({
                  id: p.id,
                  program_type: p.program_type,
                  program_name: p.program_name,
                  medication: p.medication,
                });
              }
            }
          }
        }

        // Also handle purchases without patient_id but with patient_name
        // Use a single batched OR query instead of one query per name
        const unlinkedNoPatientId = allPurchases.filter(p => !p.protocol_id && !p.session_logged && !p.patient_id && p.patient_name);
        const patientNames = [...new Set(unlinkedNoPatientId.map(p => p.patient_name.toLowerCase().trim()))];

        if (patientNames.length > 0) {
          for (let i = 0; i < patientNames.length; i += 50) {
            const batch = patientNames.slice(i, i + 50);
            const orFilter = batch.map(name => `patient_name.ilike.${name}`).join(',');
            const { data: protocols } = await supabase
              .from('protocols')
              .select('id, patient_id, patient_name, program_type, program_name, medication, status')
              .or(orFilter)
              .eq('status', 'active');

            if (protocols) {
              for (const p of protocols) {
                const key = `name:${(p.patient_name || '').toLowerCase().trim()}`;
                if (!activeProtocolsByPatient[key]) {
                  activeProtocolsByPatient[key] = [];
                }
                activeProtocolsByPatient[key].push({
                  id: p.id,
                  program_type: p.program_type,
                  program_name: p.program_name,
                  medication: p.medication,
                });
              }
            }
          }
        }
      } catch (protocolErr) {
        console.error('Protocol matching error (non-fatal):', protocolErr);
        // Non-fatal — page still works, just without matching
      }

      return res.status(200).json({
        purchases: allPurchases,
        activeProtocolsByPatient,
        total,
        revenue
      });

    } catch (error) {
      console.error('Purchases API error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  // POST - Create purchase (for manual entry)
  if (req.method === 'POST') {
    const {
      patient_name,
      patient_email,
      patient_phone,
      ghl_contact_id,
      item_name,
      amount,
      list_price,
      quantity,
      category,
      source,
      purchase_date,
      shipping
    } = req.body;

    if (!patient_name || !item_name) {
      return res.status(400).json({ error: 'patient_name and item_name required' });
    }

    try {
      const { data, error } = await supabase
        .from('purchases')
        .insert({
          patient_name,
          patient_email,
          patient_phone,
          ghl_contact_id,
          item_name,
          amount: amount || 0,
          amount_paid: amount || 0,
          list_price: list_price || null,
          quantity: quantity || 1,
          category: category || 'Other',
          source: source || 'manual',
          purchase_date: purchase_date || todayPacific(),
          shipping: shipping || 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to create purchase', details: error.message });
      }

      return res.status(201).json(data);

    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
