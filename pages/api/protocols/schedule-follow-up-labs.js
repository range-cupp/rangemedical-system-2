// /pages/api/protocols/schedule-follow-up-labs.js
// Auto-schedule follow-up labs when HRT or Weight Loss protocol is started
// Called after protocol creation
// Range Medical
// CREATED: 2026-01-26

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { protocolId, patientId, patientName, ghlContactId, programType, startDate } = req.body;

    if (!protocolId || !patientId) {
      return res.status(400).json({ error: 'protocolId and patientId required' });
    }

    // Only schedule follow-ups for HRT and Weight Loss
    const normalizedType = (programType || '').toLowerCase();
    if (!normalizedType.includes('hrt') && !normalizedType.includes('weight') && !normalizedType.includes('hormone')) {
      return res.status(200).json({ 
        success: true, 
        message: 'No follow-up labs needed for this protocol type' 
      });
    }

    // Calculate 8-week follow-up date
    const start = startDate ? new Date(startDate) : new Date();
    const firstFollowUpDate = new Date(start);
    firstFollowUpDate.setDate(firstFollowUpDate.getDate() + 56); // 8 weeks = 56 days

    // Check if follow-up already exists
    const { data: existing } = await supabase
      .from('protocol_follow_up_labs')
      .select('id')
      .eq('protocol_id', protocolId)
      .eq('follow_up_type', 'first')
      .single();

    if (existing) {
      return res.status(200).json({ 
        success: true, 
        message: 'Follow-up already scheduled',
        followUpId: existing.id
      });
    }

    // Create first follow-up lab record (8 weeks)
    const { data: followUp, error } = await supabase
      .from('protocol_follow_up_labs')
      .insert({
        protocol_id: protocolId,
        patient_id: patientId,
        patient_name: patientName,
        ghl_contact_id: ghlContactId,
        protocol_type: normalizedType.includes('hrt') ? 'HRT' : 'Weight Loss',
        follow_up_type: 'first',
        follow_up_number: 1,
        status: 'due',
        due_date: firstFollowUpDate.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      console.error('Error scheduling follow-up:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Scheduled 8-week follow-up for protocol:', protocolId, 'Due:', firstFollowUpDate);

    return res.status(200).json({
      success: true,
      followUp,
      message: `8-week follow-up scheduled for ${firstFollowUpDate.toLocaleDateString()}`
    });

  } catch (error) {
    console.error('Schedule Follow-up Error:', error);
    return res.status(500).json({ error: error.message });
  }
}


// =========================
// HELPER: Call this from protocol creation
// =========================
// After creating a protocol, call:
// 
// await fetch('/api/protocols/schedule-follow-up-labs', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({
//     protocolId: newProtocol.id,
//     patientId: newProtocol.patient_id,
//     patientName: patient.name,
//     ghlContactId: patient.ghl_contact_id,
//     programType: newProtocol.program_type,
//     startDate: newProtocol.start_date
//   })
// });
