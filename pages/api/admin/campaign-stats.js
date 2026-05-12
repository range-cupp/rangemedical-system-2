// /pages/api/admin/campaign-stats.js
// Polls Resend API for each campaign recipient's delivery/open/click status.
// Fallback for when webhooks aren't configured yet — hit "Refresh Stats" in the UI.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { campaignId } = req.body;
  if (!campaignId) return res.status(400).json({ error: 'campaignId required' });

  try {
    const { data: recipients, error } = await supabase
      .from('email_campaign_recipients')
      .select('id, resend_email_id, delivered_at, opened_at, clicked_at, bounced_at')
      .eq('campaign_id', campaignId)
      .not('resend_email_id', 'is', null);

    if (error) throw error;
    if (!recipients || recipients.length === 0) {
      return res.json({ success: true, updated: 0, total: 0, stats: { openCount: 0, clickCount: 0, bounceCount: 0 } });
    }

    // Only check recipients that might have new tracking data
    const toCheck = recipients.filter(r => !r.bounced_at && !r.clicked_at);

    let updated = 0;

    for (let i = 0; i < toCheck.length; i++) {
      const recipient = toCheck[i];
      try {
        const emailData = await resend.emails.get(recipient.resend_email_id);
        const email = emailData?.data || emailData;
        if (!email || !email.last_event) continue;

        const now = new Date().toISOString();
        const updates = {};
        const ev = email.last_event;

        if (['delivered', 'opened', 'clicked'].includes(ev) && !recipient.delivered_at) {
          updates.delivered_at = now;
        }
        if (['opened', 'clicked'].includes(ev) && !recipient.opened_at) {
          updates.opened_at = now;
        }
        if (ev === 'clicked' && !recipient.clicked_at) {
          updates.clicked_at = now;
        }
        if (ev === 'bounced' && !recipient.bounced_at) {
          updates.bounced_at = now;
          updates.status = 'bounced';
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('email_campaign_recipients')
            .update(updates)
            .eq('id', recipient.id);
          updated++;
        }

        // 200ms delay → 5 req/sec to stay within Resend rate limits
        if (i < toCheck.length - 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      } catch (err) {
        console.error(`Error checking email ${recipient.resend_email_id}:`, err.message);
      }
    }

    // Recompute campaign-level counts
    const { data: allRecipients } = await supabase
      .from('email_campaign_recipients')
      .select('opened_at, clicked_at, bounced_at')
      .eq('campaign_id', campaignId);

    const stats = {
      openCount: (allRecipients || []).filter(r => r.opened_at).length,
      clickCount: (allRecipients || []).filter(r => r.clicked_at).length,
      bounceCount: (allRecipients || []).filter(r => r.bounced_at).length,
    };

    await supabase
      .from('email_campaigns')
      .update({
        open_count: stats.openCount,
        click_count: stats.clickCount,
        bounce_count: stats.bounceCount,
      })
      .eq('id', campaignId);

    return res.json({ success: true, updated, total: toCheck.length, stats });
  } catch (err) {
    console.error('Campaign stats error:', err);
    return res.status(500).json({ error: err.message });
  }
}
