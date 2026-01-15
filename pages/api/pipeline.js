// pages/api/pipeline.js
// Pipeline API - Fetches protocols with patient names
// Deploy to: pages/api/pipeline.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch active protocols with patient info
    const { data: activeProtocols, error: activeError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_name,
        program_type,
        medication,
        selected_dose,
        frequency,
        start_date,
        end_date,
        status,
        notes,
        total_sessions,
        sessions_used,
        delivery_method,
        starting_weight,
        created_at,
        patients (
          id,
          name,
          email,
          phone,
          ghl_contact_id
        )
      `)
      .eq('status', 'active')
      .order('end_date', { ascending: true, nullsFirst: false });

    if (activeError) {
      console.error('Active protocols error:', activeError);
      return res.status(500).json({ error: 'Failed to fetch active protocols', details: activeError.message });
    }

    // Fetch completed protocols
    const { data: completedProtocols, error: completedError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_name,
        program_type,
        medication,
        selected_dose,
        start_date,
        end_date,
        status,
        delivery_method,
        created_at,
        patients (
          id,
          name,
          email,
          phone,
          ghl_contact_id
        )
      `)
      .eq('status', 'completed')
      .order('end_date', { ascending: false })
      .limit(100);

    if (completedError) {
      console.error('Completed protocols error:', completedError);
    }

    // Fetch purchases that need protocols assigned
    const { data: needsProtocol, error: needsError } = await supabase
      .from('purchases')
      .select('*')
      .is('protocol_id', null)
      .eq('dismissed', false)
      .in('category', ['HRT', 'Weight Loss', 'Peptide', 'Peptides', 'IV Therapy'])
      .order('purchase_date', { ascending: false })
      .limit(50);

    if (needsError) {
      console.error('Needs protocol error:', needsError);
    }

    // Format active protocols - flatten patient data
    const formattedActive = (activeProtocols || []).map(p => {
      // Calculate days remaining
      let days_remaining = null;
      if (p.end_date) {
        const end = new Date(p.end_date);
        const today = new Date();
        days_remaining = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      }

      // Calculate sessions remaining
      let sessions_remaining = null;
      if (p.total_sessions !== null && p.sessions_used !== null) {
        sessions_remaining = p.total_sessions - p.sessions_used;
      }

      // Calculate duration_days from start to end
      let duration_days = null;
      if (p.start_date && p.end_date) {
        const start = new Date(p.start_date);
        const end = new Date(p.end_date);
        duration_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      }

      return {
        ...p,
        patient_name: p.patients?.name || 'Unknown',
        patient_email: p.patients?.email,
        patient_phone: p.patients?.phone,
        ghl_contact_id: p.patients?.ghl_contact_id,
        days_remaining,
        sessions_remaining,
        duration_days,
        // Remove nested patients object
        patients: undefined
      };
    });

    // Format completed protocols
    const formattedCompleted = (completedProtocols || []).map(p => ({
      ...p,
      patient_name: p.patients?.name || 'Unknown',
      patient_email: p.patients?.email,
      ghl_contact_id: p.patients?.ghl_contact_id,
      patients: undefined
    }));

    // Sort active by days_remaining (soonest first), nulls at end
    formattedActive.sort((a, b) => {
      const aVal = a.days_remaining ?? a.sessions_remaining ?? 9999;
      const bVal = b.days_remaining ?? b.sessions_remaining ?? 9999;
      return aVal - bVal;
    });

    return res.status(200).json({
      activeProtocols: formattedActive,
      completedProtocols: formattedCompleted,
      needsProtocol: needsProtocol || []
    });

  } catch (error) {
    console.error('Pipeline API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
