// /pages/api/admin/pipeline.js
// Pipeline API - Returns purchases needing protocols, active protocols, and completed protocols
// Range Medical - FIXED patient_name issue 2026-01-28

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
    // Get current date for calculations
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // ============================================
    // FETCH PROTOCOLS WITH PROPER PATIENT NAMES
    // ============================================
    const { data: protocols, error: protocolsError } = await supabase
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
        notes,
        total_sessions,
        sessions_used,
        created_at,
        updated_at,
        patients (
          id,
          name,
          email,
          phone,
          ghl_contact_id
        )
      `)
      .order('start_date', { ascending: false });

    if (protocolsError) {
      console.error('Error fetching protocols:', protocolsError);
      return res.status(500).json({ error: protocolsError.message });
    }

    // Process protocols and get proper patient names
    const processedProtocols = protocols.map(p => {
      // Get patient name from the joined patients table
      const patientName = p.patients?.name || 'Unknown';
      const patientEmail = p.patients?.email || null;
      const patientPhone = p.patients?.phone || null;
      const ghlContactId = p.patients?.ghl_contact_id || null;

      // Calculate days remaining
      let daysRemaining = null;
      if (p.end_date) {
        const endDate = new Date(p.end_date);
        const diffTime = endDate - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate days since start
      let daysSinceStart = null;
      if (p.start_date) {
        const startDate = new Date(p.start_date);
        const diffTime = today - startDate;
        daysSinceStart = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        ghl_contact_id: ghlContactId,
        program_name: p.program_name,
        program_type: p.program_type,
        category: p.program_type, // Alias for compatibility
        medication: p.medication,
        selected_dose: p.selected_dose,
        frequency: p.frequency,
        delivery_method: p.delivery_method,
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status,
        notes: p.notes,
        total_sessions: p.total_sessions,
        sessions_used: p.sessions_used,
        days_remaining: daysRemaining,
        days_since_start: daysSinceStart,
        created_at: p.created_at,
        updated_at: p.updated_at
      };
    });

    // Separate into active and completed
    const activeProtocols = processedProtocols.filter(p => p.status === 'active');
    const completedProtocols = processedProtocols.filter(p => p.status === 'completed');

    // Group active protocols by urgency
    const endingSoon = activeProtocols.filter(p => 
      p.days_remaining !== null && p.days_remaining <= 3 && p.days_remaining >= 0
    ).sort((a, b) => a.days_remaining - b.days_remaining);

    const active = activeProtocols.filter(p => 
      p.days_remaining === null || (p.days_remaining > 3 && p.days_remaining <= 14)
    ).sort((a, b) => (a.days_remaining || 999) - (b.days_remaining || 999));

    const justStarted = activeProtocols.filter(p => 
      p.days_remaining !== null && p.days_remaining > 14
    ).sort((a, b) => (b.days_remaining || 0) - (a.days_remaining || 0));

    const needsFollowUp = activeProtocols.filter(p => 
      p.days_remaining !== null && p.days_remaining < 0
    ).sort((a, b) => a.days_remaining - b.days_remaining);

    // ============================================
    // FETCH PURCHASES NEEDING PROTOCOLS
    // ============================================
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .or('protocol_created.is.null,protocol_created.eq.false')
      .or('dismissed.is.null,dismissed.eq.false')
      .gte('purchase_date', twoWeeksAgoStr)
      .order('purchase_date', { ascending: false });

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
    }

    // Filter to protocol-eligible categories
    const protocolCategories = ['peptide', 'weight_loss', 'hrt', 'iv_therapy', 'hbot', 'rlt', 'injection'];
    const needsProtocol = (purchases || []).filter(p => {
      const category = (p.category || '').toLowerCase();
      const productName = (p.product_name || p.item_name || '').toLowerCase();
      
      return protocolCategories.some(cat => category.includes(cat)) ||
             productName.includes('peptide') ||
             productName.includes('protocol') ||
             productName.includes('weight loss') ||
             productName.includes('hrt') ||
             productName.includes('membership');
    });

    // ============================================
    // CALCULATE COUNTS
    // ============================================
    const counts = {
      endingSoon: endingSoon.length,
      active: active.length,
      justStarted: justStarted.length,
      needsFollowUp: needsFollowUp.length,
      completed: completedProtocols.length,
      needsProtocol: needsProtocol.length,
      totalActive: activeProtocols.length
    };

    return res.status(200).json({
      success: true,
      counts,
      protocols: {
        ending_soon: endingSoon,
        active: active,
        just_started: justStarted,
        needs_follow_up: needsFollowUp,
        completed: completedProtocols.slice(0, 100) // Limit completed
      },
      purchases: needsProtocol
    });

  } catch (error) {
    console.error('Pipeline API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
