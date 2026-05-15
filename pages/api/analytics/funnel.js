import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page, days } = req.query;
  const daysBack = parseInt(days) || 30;
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  try {
    const { data: events, error } = await supabase
      .from('page_events')
      .select('event, session_id, metadata, created_at')
      .eq('page', page || 'lab-clarity-visit')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const eventCounts = {};
    const dailyCounts = {};
    const utmSources = {};
    const uniqueSessions = new Set();

    for (const e of events || []) {
      eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;

      if (e.session_id) uniqueSessions.add(e.session_id);

      const day = new Date(e.created_at).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
      if (!dailyCounts[day]) dailyCounts[day] = {};
      dailyCounts[day][e.event] = (dailyCounts[day][e.event] || 0) + 1;

      if (e.event === 'page_view' && e.metadata?.utm_source) {
        const src = e.metadata.utm_source;
        utmSources[src] = (utmSources[src] || 0) + 1;
      }
    }

    const funnel = [
      { step: 'Page Views', event: 'page_view', count: eventCounts['page_view'] || 0 },
      { step: 'CTA Clicked', event: 'cta_click', count: eventCounts['cta_click'] || 0 },
      { step: 'Date Selected', event: 'date_select', count: eventCounts['date_select'] || 0 },
      { step: 'Time Selected', event: 'slot_select', count: eventCounts['slot_select'] || 0 },
      { step: 'Form Started', event: 'form_start', count: eventCounts['form_start'] || 0 },
      { step: 'Payment Attempted', event: 'payment_attempt', count: eventCounts['payment_attempt'] || 0 },
      { step: 'Booking Completed', event: 'booking_complete', count: eventCounts['booking_complete'] || 0 },
    ];

    return res.status(200).json({
      funnel,
      dailyCounts,
      utmSources,
      uniqueSessions: uniqueSessions.size,
      totalEvents: (events || []).length,
    });
  } catch (err) {
    console.error('Analytics funnel error:', err);
    return res.status(500).json({ error: 'Failed to load analytics.' });
  }
}
