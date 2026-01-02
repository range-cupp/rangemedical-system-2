// /pages/api/admin/pipeline.js
// Pipeline API - Returns purchases needing protocols, active protocols, and completed protocols
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
    // Get purchases that need protocols
    // Filter: protocol_created is false/null AND dismissed is false/null
    const { data: allPurchases, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        id,
        product_name,
        item_name,
        amount_paid,
        amount,
        purchase_date,
        patient_id,
        ghl_contact_id,
        patient_name,
        category,
        protocol_created,
        has_protocol,
        dismissed,
        patients (
          id,
          name
        )
      `)
      .order('purchase_date', { ascending: false });

    if (purchasesError) {
      console.error('Purchases error:', purchasesError);
    }

    // Filter to only purchases that need protocols
    const needsProtocol = (allPurchases || []).filter(p => 
      // Not already has a protocol
      (p.protocol_created !== true && p.has_protocol !== true) &&
      // Not dismissed
      (p.dismissed !== true)
    );

    // Get all protocols
    const { data: allProtocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_name,
        program_type,
        medication,
        selected_dose,
        frequency,
        delivery_method,
        start_date,
        end_date,
        status,
        total_sessions,
        sessions_used,
        notes,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (protocolsError) {
      console.error('Protocols error:', protocolsError);
    }

    // Get patient names for protocols
    const patientIds = [...new Set((allProtocols || []).map(p => p.patient_id).filter(Boolean))];
    let patientMap = {};
    
    if (patientIds.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name')
        .in('id', patientIds);
      
      (patients || []).forEach(p => {
        patientMap[p.id] = p.name;
      });
    }

    // Separate active and completed protocols
    const activeProtocols = [];
    const completedProtocols = [];

    (allProtocols || []).forEach(protocol => {
      const formatted = {
        ...protocol,
        patient_name: patientMap[protocol.patient_id] || 'Unknown'
      };

      if (protocol.status === 'completed') {
        completedProtocols.push(formatted);
      } else if (protocol.status === 'active') {
        // Calculate days remaining
        const endDate = protocol.end_date ? new Date(protocol.end_date) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let daysRemaining = null;
        if (endDate) {
          daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        }
        
        activeProtocols.push({ ...formatted, days_remaining: daysRemaining });
      }
    });

    // Format purchases for response
    const formatPurchase = (p) => ({
      id: p.id,
      product_name: p.item_name || p.product_name,
      amount_paid: p.amount || p.amount_paid,
      purchase_date: p.purchase_date,
      patient_id: p.patient_id,
      ghl_contact_id: p.ghl_contact_id,
      patient_name: p.patients?.name || p.patient_name || 'Unknown',
      category: p.category
    });

    return res.status(200).json({
      needsProtocol: needsProtocol.map(formatPurchase),
      activeProtocols,
      completedProtocols
    });

  } catch (error) {
    console.error('Pipeline error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
