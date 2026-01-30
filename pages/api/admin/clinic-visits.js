// /pages/api/admin/clinic-visits.js
// Get all in-clinic protocols with visit tracking data

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
    // Get all in-clinic protocols with patient info
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('*, patients(id, first_name, last_name, name, email, phone)')
      .eq('delivery_method', 'in_clinic')
      .eq('status', 'active')
      .order('program_type', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch protocols', details: error.message });
    }

    // Get today's date for comparison
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Get all sessions for this week to count visits
    const protocolIds = protocols.map(p => p.id);

    const { data: sessions } = await supabase
      .from('sessions')
      .select('protocol_id, session_date')
      .in('protocol_id', protocolIds)
      .gte('session_date', weekStartStr)
      .lte('session_date', todayStr);

    // Count visits per protocol this week
    const visitsThisWeek = {};
    (sessions || []).forEach(s => {
      visitsThisWeek[s.protocol_id] = (visitsThisWeek[s.protocol_id] || 0) + 1;
    });

    // Enhance protocols with visit counts
    const enhancedProtocols = protocols.map(p => ({
      ...p,
      visits_this_week: visitsThisWeek[p.id] || 0
    }));

    return res.status(200).json({
      protocols: enhancedProtocols,
      total: protocols.length,
      today: todayStr
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
