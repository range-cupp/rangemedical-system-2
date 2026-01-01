// /pages/api/admin/pipeline.js
// Pipeline API - Fixed with correct column names

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

    // Get purchases that need protocols (not dismissed, no protocol assigned)
    // Using correct column names: patient_name, item_name, amount
    const { data: needsProtocol, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('protocol_created', false)
      .eq('dismissed', false)
      .order('purchase_date', { ascending: false })
      .limit(50);

    if (purchasesError) {
      console.error('Purchases error:', purchasesError);
    }

    // Get active protocols (not completed, end_date >= today or no end_date)
    const { data: activeProtocols, error: activeError } = await supabase
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
        patients (
          id,
          name
        )
      `)
      .or(`end_date.gte.${today},end_date.is.null`)
      .neq('status', 'completed')
      .order('start_date', { ascending: false })
      .limit(100);

    if (activeError) {
      console.error('Active protocols error:', activeError);
    }

    // Get completed protocols
    const { data: completedProtocols, error: completedError } = await supabase
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
        patients (
          id,
          name
        )
      `)
      .or(`status.eq.completed,end_date.lt.${today}`)
      .order('end_date', { ascending: false })
      .limit(100);

    if (completedError) {
      console.error('Completed protocols error:', completedError);
    }

    // Format purchases - use correct column names
    const formatPurchase = (p) => ({
      id: p.id,
      product_name: p.item_name || p.original_item_name || 'Unknown Item',
      amount_paid: p.amount || 0,
      purchase_date: p.purchase_date,
      patient_id: p.patient_id,
      patient_name: p.patient_name || 'Unknown',
      ghl_contact_id: p.ghl_contact_id,
      category: p.category
    });

    const formatProtocol = (p) => {
      const endDate = p.end_date ? new Date(p.end_date) : null;
      const todayDate = new Date();
      const daysRemaining = endDate ? Math.ceil((endDate - todayDate) / (1000 * 60 * 60 * 24)) : null;
      
      return {
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
        days_remaining: daysRemaining
      };
    };

    return res.status(200).json({
      needsProtocol: (needsProtocol || []).map(formatPurchase),
      activeProtocols: (activeProtocols || []).map(formatProtocol),
      completedProtocols: (completedProtocols || []).map(formatProtocol)
    });

  } catch (error) {
    console.error('Pipeline error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
