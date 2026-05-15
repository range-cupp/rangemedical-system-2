import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { days } = req.query;
  const daysBack = parseInt(days) || 30;
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  try {
    const { data: events, error } = await supabase
      .from('page_events')
      .select('page, event, session_id, metadata, referrer, path, device_type, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const pages = {};
    const sessions = {};
    const devices = { mobile: 0, desktop: 0, unknown: 0 };
    const utmSources = {};
    const referrers = {};
    const dailyCounts = {};
    const uniqueSessions = new Set();

    for (const e of events || []) {
      if (e.session_id) uniqueSessions.add(e.session_id);

      if (e.event === 'page_view') {
        const pageName = e.page || 'unknown';
        if (!pages[pageName]) pages[pageName] = { views: 0, sessions: new Set() };
        pages[pageName].views++;
        if (e.session_id) pages[pageName].sessions.add(e.session_id);

        const dev = e.device_type || 'unknown';
        devices[dev] = (devices[dev] || 0) + 1;

        if (e.metadata?.utm_source) {
          const src = e.metadata.utm_source;
          utmSources[src] = (utmSources[src] || 0) + 1;
        }

        if (e.referrer) {
          try {
            const host = new URL(e.referrer).hostname.replace('www.', '');
            referrers[host] = (referrers[host] || 0) + 1;
          } catch {
            referrers[e.referrer] = (referrers[e.referrer] || 0) + 1;
          }
        }

        const day = new Date(e.created_at).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }

      if (e.session_id) {
        if (!sessions[e.session_id]) sessions[e.session_id] = [];
        sessions[e.session_id].push({
          page: e.page,
          event: e.event,
          path: e.path,
          time: e.created_at,
          device: e.device_type,
        });
      }
    }

    const pageList = Object.entries(pages)
      .map(([name, data]) => ({ page: name, views: data.views, visitors: data.sessions.size }))
      .sort((a, b) => b.views - a.views);

    const totalViews = pageList.reduce((sum, p) => sum + p.views, 0);

    const recentSessions = Object.entries(sessions)
      .filter(([, steps]) => steps.length > 0)
      .map(([id, steps]) => ({
        id,
        device: steps[0].device,
        pages: steps.filter(s => s.event === 'page_view').map(s => s.page),
        events: steps.map(s => s.event),
        started: steps[0].time,
      }))
      .sort((a, b) => new Date(b.started) - new Date(a.started))
      .slice(0, 50);

    return res.status(200).json({
      totalViews,
      uniqueVisitors: uniqueSessions.size,
      mobilePercent: totalViews > 0 ? Math.round((devices.mobile / totalViews) * 100) : 0,
      pages: pageList,
      devices,
      utmSources,
      referrers,
      dailyCounts,
      recentSessions,
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    return res.status(500).json({ error: 'Failed to load analytics.' });
  }
}
