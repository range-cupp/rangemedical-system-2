// /pages/api/patients/[id]/comms.js
// Per-patient communications API
// Supports channel filter and pagination
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const limit = Math.min(500, parseInt(req.query.limit) || 200);
  const offset = parseInt(req.query.offset) || 0;
  const channel = req.query.channel; // 'sms' | 'email' | 'call' | undefined (all)
  const phone = req.query.phone; // optional: query by phone instead of patient_id

  if (!id && !phone) {
    return res.status(400).json({ error: 'Patient ID or phone required' });
  }

  try {
    // Build filter for both data query and count query.
    // IMPORTANT: When patient_id is available, query by patient_id only.
    // Do NOT use .or() with a formatted phone number (e.g. "(949) 539-5023") —
    // PostgREST parses the .or() filter string literally, and parentheses in the
    // phone value are interpreted as grouping syntax, breaking the query silently.
    // If phone-only fallback is needed (truly orphaned messages), we handle it
    // separately below rather than in a combined OR.
    const buildFilter = (q) => {
      if (id && id !== '_') {
        q = q.eq('patient_id', id);
      } else if (phone) {
        q = q.eq('recipient', phone);
      }
      if (channel) q = q.eq('channel', channel);
      return q;
    };

    // Get total count
    let countQuery = supabase.from('comms_log').select('id', { count: 'exact', head: true });
    countQuery = buildFilter(countQuery);
    const { count: totalCount } = await countQuery;

    // Get paginated data
    let query = supabase
      .from('comms_log')
      .select('id, channel, message_type, message, status, error_message, recipient, subject, direction, source, created_at, needs_response');
    query = buildFilter(query);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: comms, error } = await query;

    if (error) throw error;

    // When querying by patient_id, also fetch any "orphaned" messages stored before
    // the patient was linked (patient_id=null, but recipient matches patient's phone).
    // This covers messages logged before the patient record existed.
    let allComms = comms || [];
    if (id && id !== '_' && phone && offset === 0) {
      // Normalize phone to last 10 digits for a safe ilike match
      const digits = phone.replace(/\D/g, '').slice(-10);
      if (digits.length >= 7) {
        const { data: orphaned } = await supabase
          .from('comms_log')
          .select('id, channel, message_type, message, status, error_message, recipient, subject, direction, source, created_at, needs_response')
          .is('patient_id', null)
          .ilike('recipient', `%${digits}`)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (orphaned && orphaned.length > 0) {
          const existingIds = new Set(allComms.map(m => m.id));
          const newOrphans = orphaned.filter(m => !existingIds.has(m.id));
          if (newOrphans.length > 0) {
            allComms = [...allComms, ...newOrphans]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, limit);
          }
        }
      }
    }

    return res.status(200).json({
      comms: allComms,
      total: totalCount || 0,
      offset,
      limit,
      hasMore: offset + limit < (totalCount || 0),
    });

  } catch (error) {
    console.error('Comms API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
