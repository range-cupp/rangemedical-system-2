// /pages/api/admin/comms-log.js
// GET endpoint for the Comms tab in the command center
// Supports pagination, channel filter, search, and date range
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
    const {
      page = '1',
      limit = '50',
      channel,
      search,
      days = '30',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Date filter
    const daysNum = parseInt(days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - daysNum);

    // Build query
    let query = supabase
      .from('comms_log')
      .select('*', { count: 'exact' })
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (channel && (channel === 'sms' || channel === 'email')) {
      query = query.eq('channel', channel);
    }

    if (search) {
      query = query.ilike('patient_name', `%${search}%`);
    }

    const { data: logs, error, count } = await query;

    if (error) throw error;

    // For rows missing patient_name, look up from patients table
    const needsName = (logs || []).filter(l => !l.patient_name && l.patient_id);
    if (needsName.length > 0) {
      const patientIds = [...new Set(needsName.map(l => l.patient_id))];
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name')
        .in('id', patientIds);

      if (patients) {
        const nameMap = Object.fromEntries(patients.map(p => [p.id, p.name]));
        for (const log of logs) {
          if (!log.patient_name && log.patient_id && nameMap[log.patient_id]) {
            log.patient_name = nameMap[log.patient_id];
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      logs: logs || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });

  } catch (error) {
    console.error('Comms log API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
