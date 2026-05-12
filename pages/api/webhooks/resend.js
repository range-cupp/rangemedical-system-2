// /pages/api/webhooks/resend.js
// Receives Resend webhook events (opened, clicked, delivered, bounced, complained)
// and updates email_campaign_recipients tracking columns.
// Configure this URL in your Resend dashboard → Webhooks.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const event = req.body;
    const emailId = event?.data?.email_id;

    if (!emailId) return res.status(200).json({ received: true });

    const { data: recipient } = await supabase
      .from('email_campaign_recipients')
      .select('id, campaign_id, delivered_at, opened_at, clicked_at')
      .eq('resend_email_id', emailId)
      .single();

    if (!recipient) return res.status(200).json({ received: true });

    const now = new Date().toISOString();
    const updates = {};

    switch (event.type) {
      case 'email.delivered':
        if (!recipient.delivered_at) updates.delivered_at = now;
        break;
      case 'email.opened':
        if (!recipient.delivered_at) updates.delivered_at = now;
        if (!recipient.opened_at) updates.opened_at = now;
        break;
      case 'email.clicked':
        if (!recipient.delivered_at) updates.delivered_at = now;
        if (!recipient.opened_at) updates.opened_at = now;
        if (!recipient.clicked_at) updates.clicked_at = now;
        break;
      case 'email.bounced':
        updates.bounced_at = now;
        updates.status = 'bounced';
        break;
      case 'email.complained':
        updates.status = 'complained';
        break;
      default:
        return res.status(200).json({ received: true });
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('email_campaign_recipients')
        .update(updates)
        .eq('id', recipient.id);

      await refreshCampaignCounts(recipient.campaign_id);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Resend webhook error:', err);
    return res.status(200).json({ received: true });
  }
}

async function refreshCampaignCounts(campaignId) {
  const { data: recipients } = await supabase
    .from('email_campaign_recipients')
    .select('opened_at, clicked_at, bounced_at')
    .eq('campaign_id', campaignId);

  if (!recipients) return;

  await supabase
    .from('email_campaigns')
    .update({
      open_count: recipients.filter(r => r.opened_at).length,
      click_count: recipients.filter(r => r.clicked_at).length,
      bounce_count: recipients.filter(r => r.bounced_at).length,
    })
    .eq('id', campaignId);
}
