// /pages/api/webhooks/calcom.js
// Cal.com webhook receiver — DISABLED 2026-05-04 at the end of the
// Cal.com cutover. Range Medical no longer creates bookings in Cal.com,
// so this endpoint should never receive real traffic. We accept the
// request and return 200 (so Cal.com doesn't retry endlessly if anything
// is still pointed here), then log it to surface stray events.

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const triggerEvent = req.body?.triggerEvent || 'unknown';
  console.log('[calcom-webhook] DISABLED — ignored event:', triggerEvent);
  return res.status(200).json({
    success: true,
    message: 'Cal.com webhook is disabled — Range Medical no longer integrates with Cal.com.',
    triggerEvent,
  });
}
