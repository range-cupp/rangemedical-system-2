// /pages/api/protocols/assign.js
// Assign a protocol template to a patient

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    patientId, 
    templateId, 
    notificationId,
    purchaseId,
    startDate,
    customMedication,
    customDose,
    customSessions,
    notes 
  } = req.body;

  try {
    // Call the database function
    const { data, error } = await supabase.rpc('assign_protocol_to_patient', {
      p_patient_id: patientId,
      p_template_id: templateId,
      p_purchase_id: purchaseId || null,
      p_notification_id: notificationId || null,
      p_start_date: startDate || new Date().toISOString().split('T')[0],
      p_custom_medication: customMedication || null,
      p_custom_dose: customDose || null,
      p_custom_sessions: customSessions || null,
      p_notes: notes || null
    });

    if (error) throw error;

    return res.status(200).json(data);

  } catch (error) {
    console.error('Error assigning protocol:', error);
    return res.status(500).json({ error: error.message });
  }
}
