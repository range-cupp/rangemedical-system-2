// /pages/api/lab-orders/create.js
// Create a lab order from a purchase
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { purchaseId, patientId, orderType, notes } = req.body;

  if (!purchaseId || !patientId) {
    return res.status(400).json({ error: 'purchaseId and patientId required' });
  }

  try {
    // Create the lab order
    const { data: labOrder, error: labError } = await supabase
      .from('lab_orders')
      .insert({
        patient_id: patientId,
        purchase_id: purchaseId,
        order_type: orderType || 'Standard',
        order_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (labError) {
      console.error('Error creating lab order:', labError);
      return res.status(500).json({ error: 'Failed to create lab order' });
    }

    // Mark the purchase as handled (so it leaves the pipeline)
    await supabase
      .from('purchases')
      .update({
        protocol_created: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId);

    // Auto-create lab journey so patient appears in Labs pipeline
    let patientName = 'Unknown Patient';
    const { data: patient } = await supabase
      .from('patients')
      .select('first_name, last_name, ghl_contact_id')
      .eq('id', patientId)
      .single();

    if (patient) {
      patientName = [patient.first_name, patient.last_name].filter(Boolean).join(' ') || 'Unknown Patient';
    }

    const { error: journeyError } = await supabase
      .from('lab_journeys')
      .insert({
        patient_id: patientId,
        patient_name: patientName,
        ghl_contact_id: patient?.ghl_contact_id || null,
        journey_type: 'new_patient',
        stage: 'scheduled',
      });

    if (journeyError) {
      console.error('Error creating lab journey (non-blocking):', journeyError);
    }

    return res.status(200).json({
      success: true,
      labOrder
    });

  } catch (error) {
    console.error('Lab order error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
