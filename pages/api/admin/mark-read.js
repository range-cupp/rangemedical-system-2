// /pages/api/admin/mark-read.js
// Mark inbound messages as read (all channels: SMS, email, calls)
// Range Medical

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
    const { patientId, patientPhone, all } = req.body;

    if (!patientId && !patientPhone && !all) {
      return res.status(400).json({ error: 'patientId, patientPhone, or all:true required' });
    }

    const now = new Date().toISOString();

    if (all) {
      // Mark ALL unread inbound messages as read (all channels)
      const { data, error } = await supabase
        .from('comms_log')
        .update({ read_at: now })
        .eq('direction', 'inbound')
        .is('read_at', null)
        .select('id');

      if (error) {
        console.error('Mark all read error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        marked: data?.length || 0,
      });
    }

    let totalMarked = 0;

    // 1) Mark by patient_id (rows that were correctly linked to a patient)
    if (patientId) {
      const { data, error } = await supabase
        .from('comms_log')
        .update({ read_at: now })
        .eq('direction', 'inbound')
        .eq('patient_id', patientId)
        .is('read_at', null)
        .select('id');

      if (error) {
        console.error('Mark read by patient_id error:', error);
      } else {
        totalMarked += data?.length || 0;
      }
    }

    // 2) Mark by phone number (orphaned rows stored with patient_id = null — common when
    //    Twilio receives a message before the sender is matched to a patient record)
    if (patientPhone) {
      // Normalize: strip non-digits, keep last 10, try both +1 and raw 10-digit forms
      const digits = patientPhone.replace(/\D/g, '').slice(-10);
      const e164 = `+1${digits}`;

      const { data, error } = await supabase
        .from('comms_log')
        .update({ read_at: now })
        .eq('direction', 'inbound')
        .is('patient_id', null)   // only orphaned rows — avoids double-counting
        .is('read_at', null)
        .or(`recipient.eq.${digits},recipient.eq.+1${digits},recipient.eq.${patientPhone}`)
        .select('id');

      if (error) {
        console.error('Mark read by phone error:', error);
      } else {
        totalMarked += data?.length || 0;
      }
    }

    return res.status(200).json({
      success: true,
      marked: totalMarked,
    });

  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: error.message });
  }
}
