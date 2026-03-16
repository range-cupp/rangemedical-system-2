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

      return res.status(200).json({ success: true, marked: data?.length || 0 });
    }

    let totalMarked = 0;

    // ── 1) Clear by patient_id ────────────────────────────────────────────────
    // Handles all rows correctly linked to a patient record.
    if (patientId) {
      const { data, error } = await supabase
        .from('comms_log')
        .update({ read_at: now })
        .eq('direction', 'inbound')
        .eq('patient_id', patientId)
        .is('read_at', null)
        .select('id');

      if (error) {
        console.error('[mark-read] patient_id query error:', error.message);
      } else {
        totalMarked += data?.length || 0;
        console.log(`[mark-read] patient_id=${patientId}: marked ${data?.length || 0} rows`);
      }
    }

    // ── 2) Clear by phone number ──────────────────────────────────────────────
    // Handles orphaned rows stored with patient_id=null (Twilio/Blooio received the
    // message before the sender was matched to a patient record, or the match failed).
    // We run SEPARATE queries for each phone format to avoid .or() encoding issues
    // with the + character in E.164 numbers.
    if (patientPhone) {
      const raw = patientPhone.replace(/\D/g, '');
      const digits10 = raw.slice(-10);           // e.g. "9492754000"
      const e164 = `+1${digits10}`;              // e.g. "+19492754000"

      // Collect all format variants to try — deduplicated
      const formats = [...new Set([
        digits10,
        e164,
        patientPhone.trim(),                     // original, whatever format it came in
      ])];

      for (const fmt of formats) {
        const { data, error } = await supabase
          .from('comms_log')
          .update({ read_at: now })
          .eq('direction', 'inbound')
          .eq('recipient', fmt)
          .is('read_at', null)           // guard: skip already-cleared rows
          .select('id');

        if (error) {
          console.error(`[mark-read] phone query (${fmt}) error:`, error.message);
        } else if (data?.length > 0) {
          totalMarked += data.length;
          console.log(`[mark-read] phone=${fmt}: marked ${data.length} rows`);
        }
      }
    }

    console.log(`[mark-read] total marked: ${totalMarked}`);
    return res.status(200).json({ success: true, marked: totalMarked });

  } catch (error) {
    console.error('[mark-read] unexpected error:', error);
    return res.status(500).json({ error: error.message });
  }
}
