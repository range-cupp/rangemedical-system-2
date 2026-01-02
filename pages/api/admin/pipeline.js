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
    const { data: allPurchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (purchasesError) {
      console.error('Purchases error:', purchasesError);
      return res.status(500).json({ error: 'Failed to fetch purchases', details: purchasesError.message });
    }

    console.log('Total purchases fetched:', allPurchases?.length || 0);

    // Filter to only purchases that need protocols
    // Keep purchases where protocol_created is NOT true AND dismissed is NOT true
    const needsProtocol = (allPurchases || []).filter(p => {
      const hasProtocol = p.protocol_created === true || p.has_protocol === true;
      const isDismissed = p.dismissed === true;
      return !hasProtocol && !isDismissed;
    });

    console.log('Needs protocol count:', needsProtocol.length);

    // Get all unique ghl_contact_ids from purchases that don't have patient_id
    const ghlContactIds = [...new Set(
      needsProtocol
        .filter(p => !p.patient_id && p.ghl_contact_id)
        .map(p => p.ghl_contact_id)
    )];

    // Look up patients by ghl_contact_id
    let patientByGhl = {};
    if (ghlContactIds.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name, ghl_contact_id')
        .in('ghl_contact_id', ghlContactIds);
      
      (patients || []).forEach(p => {
        patientByGhl[p.ghl_contact_id] = { id: p.id, name: p.name };
      });
    }

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
    const protocolsToComplete = []; // Track protocols that need to be auto-completed

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    (allProtocols || []).forEach(protocol => {
      const formatted = {
        ...protocol,
        patient_name: patientMap[protocol.patient_id] || 'Unknown'
      };

      if (protocol.status === 'completed') {
        completedProtocols.push(formatted);
      } else if (protocol.status === 'active') {
        // Check if protocol should be auto-completed
        let shouldComplete = false;
        
        // Session-based: complete when sessions_used >= total_sessions
        if (protocol.total_sessions && protocol.sessions_used >= protocol.total_sessions) {
          shouldComplete = true;
        }
        
        // Duration-based: complete when end_date has passed
        const endDate = protocol.end_date ? new Date(protocol.end_date + 'T23:59:59') : null;
        if (endDate && endDate < today) {
          shouldComplete = true;
        }
        
        if (shouldComplete) {
          protocolsToComplete.push(protocol.id);
          completedProtocols.push({ ...formatted, days_remaining: 0 });
        } else {
          // Calculate days remaining for sorting
          let daysRemaining = null;
          if (endDate) {
            daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          }
          
          // Calculate sessions remaining for session-based protocols
          let sessionsRemaining = null;
          if (protocol.total_sessions) {
            sessionsRemaining = protocol.total_sessions - (protocol.sessions_used || 0);
          }
          
          activeProtocols.push({ 
            ...formatted, 
            days_remaining: daysRemaining,
            sessions_remaining: sessionsRemaining
          });
        }
      }
    });

    // Auto-complete protocols that are done
    if (protocolsToComplete.length > 0) {
      await supabase
        .from('protocols')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .in('id', protocolsToComplete);
      
      console.log(`Auto-completed ${protocolsToComplete.length} protocols`);
    }

    // Sort active protocols: 
    // 1. Session-based by sessions remaining (lowest first)
    // 2. Duration-based by days remaining (lowest first)
    // 3. Nulls at the end
    activeProtocols.sort((a, b) => {
      // Get the relevant "remaining" value for each
      const aRemaining = a.sessions_remaining ?? a.days_remaining ?? 9999;
      const bRemaining = b.sessions_remaining ?? b.days_remaining ?? 9999;
      return aRemaining - bRemaining;
    });

    // Sort completed protocols by end_date or created_at (most recent first)
    completedProtocols.sort((a, b) => {
      const aDate = new Date(a.end_date || a.created_at);
      const bDate = new Date(b.end_date || b.created_at);
      return bDate - aDate;
    });

    // Format purchases for response
    const formatPurchase = (p) => {
      // Try to get patient_id from purchase, or look up from ghl_contact_id
      let patientId = p.patient_id;
      let patientName = p.patient_name;
      
      if (!patientId && p.ghl_contact_id && patientByGhl[p.ghl_contact_id]) {
        patientId = patientByGhl[p.ghl_contact_id].id;
        if (!patientName || patientName === 'Unknown') {
          patientName = patientByGhl[p.ghl_contact_id].name;
        }
      }
      
      return {
        id: p.id,
        product_name: p.item_name || p.product_name,
        amount_paid: p.amount || p.amount_paid,
        purchase_date: p.purchase_date,
        patient_id: patientId,
        ghl_contact_id: p.ghl_contact_id,
        patient_name: patientName || 'Unknown',
        category: p.category
      };
    };

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
