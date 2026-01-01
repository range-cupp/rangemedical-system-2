// /pages/api/admin/pipeline.js
// Pipeline API - Returns purchases needing protocols, active, and completed
// WITH auto-completion of expired protocols

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // AUTO-COMPLETE: Update all protocols that are past their end date
    // Only for day-based protocols (not session-based packs)
    await supabase
      .from('protocols')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'active')
      .lt('end_date', today)
      .is('total_sessions', null);  // Only day-based, not session-based

    // Get purchases that need protocols (not dismissed, no protocol assigned)
    const { data: needsProtocol, error: purchasesError } = await supabase
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
        category,
        protocol_created,
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

    // Get all patients for ghl_contact_id lookup
    const { data: allPatients } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id')
      .not('ghl_contact_id', 'is', null);

    // Create lookup map
    const patientsByGhl = {};
    (allPatients || []).forEach(p => {
      if (p.ghl_contact_id) {
        patientsByGhl[p.ghl_contact_id] = p;
      }
    });

    // Get ALL protocols
    const { data: allProtocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        program_name,
        medication,
        selected_dose,
        frequency,
        start_date,
        end_date,
        status,
        patient_id,
        total_sessions,
        sessions_used,
        patients (
          id,
          name
        )
      `)
      .order('start_date', { ascending: false })
      .limit(200);

    if (protocolsError) {
      console.error('Protocols error:', protocolsError);
    }

    // Separate active vs completed
    const activeProtocols = [];
    const completedProtocols = [];

    (allProtocols || []).forEach(p => {
      // Completed if:
      // - status is 'completed' or 'cancelled'
      // - OR end_date is in the past (for day-based)
      // - OR sessions_used >= total_sessions (for session-based)
      
      const isCompleted = 
        p.status === 'completed' || 
        p.status === 'cancelled' ||
        (p.end_date && p.end_date < today && !p.total_sessions) ||
        (p.total_sessions && p.sessions_used >= p.total_sessions);

      const formatted = {
        id: p.id,
        program_name: p.program_name,
        medication: p.medication,
        selected_dose: p.selected_dose,
        frequency: p.frequency,
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status,
        patient_id: p.patient_id,
        patient_name: p.patients?.name || 'Unknown',
        total_sessions: p.total_sessions,
        sessions_used: p.sessions_used
      };

      if (isCompleted) {
        completedProtocols.push(formatted);
      } else if (p.status === 'active' || p.status === 'paused') {
        // Calculate days remaining for active protocols
        const endDate = p.end_date ? new Date(p.end_date) : null;
        const daysRemaining = endDate 
          ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
          : null;
        activeProtocols.push({ ...formatted, days_remaining: daysRemaining });
      }
    });

    // Format purchases - look up patient name by ghl_contact_id if needed
    const formatPurchase = (p) => {
      // Try direct join first, then ghl_contact_id lookup
      let patientName = p.patients?.name;
      let patientId = p.patient_id;
      
      if (!patientName && p.ghl_contact_id && patientsByGhl[p.ghl_contact_id]) {
        patientName = patientsByGhl[p.ghl_contact_id].name;
        patientId = patientsByGhl[p.ghl_contact_id].id;
      }

      return {
        id: p.id,
        product_name: p.item_name || p.product_name,
        amount_paid: p.amount || p.amount_paid,
        purchase_date: p.purchase_date,
        patient_id: patientId,
        ghl_contact_id: p.ghl_contact_id,
        category: p.category,
        patient_name: patientName || 'Unknown'
      };
    };

    // Filter to only purchases that actually need protocols
    // Keep purchases where protocol_created is false/null/undefined AND dismissed is false/null/undefined
    const filteredPurchases = (needsProtocol || []).filter(p => 
      (p.protocol_created === false || p.protocol_created === null || p.protocol_created === undefined) &&
      (p.dismissed === false || p.dismissed === null || p.dismissed === undefined)
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
