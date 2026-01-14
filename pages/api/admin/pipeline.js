// /pages/api/admin/pipeline.js
// Pipeline API - Returns purchases needing protocols, active, and completed
// Range Medical

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
    const today = new Date().toISOString().split('T')[0];

    // Get purchases that need protocols
    const { data: needsProtocol } = await supabase
      .from('purchases')
      .select(`
        *,
        patients (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('protocol_created', false)
      .eq('dismissed', false)
      .order('purchase_date', { ascending: false });

    // Get all patients for GHL lookup
    const { data: allPatients } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id');
    
    const patientsByGhl = {};
    (allPatients || []).forEach(p => {
      if (p.ghl_contact_id) {
        patientsByGhl[p.ghl_contact_id] = p;
      }
    });

    // Get active protocols - include ALL fields
    const { data: protocols } = await supabase
      .from('protocols')
      .select(`
        *,
        patients (
          id,
          name,
          email,
          phone,
          ghl_contact_id
        )
      `)
      .order('start_date', { ascending: false });

    // Format protocol with ALL fields
    const formatProtocol = (p) => {
      // Get patient name from join or fallback to lookup
      let patientName = 'Unknown Patient';
      let patientId = p.patient_id;
      let ghlContactId = null;
      
      // Check if patients join returned data
      if (p.patients && p.patients.name) {
        patientName = p.patients.name;
        ghlContactId = p.patients.ghl_contact_id;
      } else if (p.patient_id && patientsByGhl) {
        // Try to find patient by ID in our cached list
        const patient = allPatients?.find(pt => pt.id === p.patient_id);
        if (patient) {
          patientName = patient.name || 'Unknown Patient';
          ghlContactId = patient.ghl_contact_id;
        }
      }

      return {
        id: p.id,
        patient_id: patientId,
        patient_name: patientName,
        ghl_contact_id: ghlContactId,
        program_type: p.program_type,
        program_name: p.program_name,
        medication: p.medication || p.primary_peptide,
        selected_dose: p.selected_dose || p.dose_amount,
        frequency: p.frequency || p.dose_frequency,
        delivery_method: p.delivery_method,
        start_date: p.start_date,
        end_date: p.end_date,
        duration_days: p.duration_days,  // Important: include this!
        total_days: p.duration_days,     // Alias for compatibility
        total_sessions: p.total_sessions,
        sessions_used: p.sessions_used,
        total_injections: p.total_injections,
        injections_used: p.injections_used,
        status: p.status,
        notes: p.notes,
        created_at: p.created_at
      };
    };

    // Split into active and completed
    const activeProtocols = [];
    const completedProtocols = [];

    (protocols || []).forEach(p => {
      const formatted = formatProtocol(p);
      
      // Calculate days_remaining for day-based protocols
      if (p.end_date) {
        const endDate = new Date(p.end_date + 'T23:59:59');
        const now = new Date();
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        formatted.days_remaining = daysRemaining;
      }

      if (p.status === 'completed' || (p.end_date && new Date(p.end_date) < new Date(today))) {
        completedProtocols.push(formatted);
      } else if (p.status !== 'cancelled') {
        activeProtocols.push(formatted);
      }
    });

    // Format purchases
    const formatPurchase = (p) => {
      let patientName = p.patients?.name;
      let patientId = p.patient_id;
      
      if (!patientName && p.ghl_contact_id && patientsByGhl[p.ghl_contact_id]) {
        patientName = patientsByGhl[p.ghl_contact_id].name;
        patientId = patientsByGhl[p.ghl_contact_id].id;
      }

      return {
        id: p.id,
        product_name: p.item_name || p.product_name,
        item_name: p.item_name,
        amount_paid: p.amount || p.amount_paid,
        amount: p.amount,
        purchase_date: p.purchase_date,
        patient_id: patientId,
        ghl_contact_id: p.ghl_contact_id,
        patient_name: patientName || 'Unknown'
      };
    };

    const filteredPurchases = (needsProtocol || []).filter(p => 
      p.protocol_created !== true && p.dismissed !== true
    );

    return res.status(200).json({
      needsProtocol: filteredPurchases.map(formatPurchase),
      activeProtocols,
      completedProtocols
    });

  } catch (error) {
    console.error('Pipeline error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
