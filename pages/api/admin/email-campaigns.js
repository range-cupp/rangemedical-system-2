// /pages/api/admin/email-campaigns.js
// CRUD for email campaigns + send functionality

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';
import { querySegment } from './email-segments';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // If ?id= is present, return campaign detail with recipients
    if (req.query.id) return getCampaignDetail(req, res);
    return listCampaigns(req, res);
  }
  if (req.method === 'POST') return createOrSend(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

// List all campaigns
async function listCampaigns(req, res) {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ campaigns: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Get campaign detail with all recipients
async function getCampaignDetail(req, res) {
  try {
    const { id } = req.query;
    const { data: campaign, error: cErr } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();
    if (cErr) throw cErr;

    const { data: recipients, error: rErr } = await supabase
      .from('email_campaign_recipients')
      .select('id, patient_id, email, status, error_message, resend_email_id, sent_at')
      .eq('campaign_id', id)
      .order('sent_at', { ascending: true });
    if (rErr) throw rErr;

    return res.json({ campaign, recipients: recipients || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Create campaign or send it
async function createOrSend(req, res) {
  try {
    const { action, campaign } = req.body;

    if (action === 'save') {
      return saveCampaign(req, res, campaign);
    }
    if (action === 'send') {
      return sendCampaign(req, res, campaign);
    }

    return res.status(400).json({ error: 'Invalid action. Use "save" or "send".' });
  } catch (err) {
    console.error('Campaign error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Save as draft
async function saveCampaign(req, res, campaign) {
  const row = {
    name: campaign.name,
    subject: campaign.subject,
    html_body: campaign.htmlBody,
    segment_snapshot: campaign.filters || {},
    from_email: campaign.fromEmail || null,
    reply_to: campaign.replyTo || null,
    status: 'draft',
  };

  if (campaign.id) {
    const { data, error } = await supabase
      .from('email_campaigns')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', campaign.id)
      .select()
      .single();
    if (error) throw error;
    return res.json({ campaign: data });
  }

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return res.json({ campaign: data });
}

// Send campaign to all segment recipients
async function sendCampaign(req, res, campaign) {
  const { name, subject, htmlBody, filters, fromEmail, replyTo } = campaign;

  if (!subject || !htmlBody) {
    return res.status(400).json({ error: 'Subject and email body are required' });
  }

  // Get recipients from segment
  const patients = await querySegment(filters || {});
  const recipients = patients.filter(p => p.email);

  if (recipients.length === 0) {
    return res.status(400).json({ error: 'No recipients with email addresses in this segment' });
  }

  // Build from/reply-to
  const fromAddr = fromEmail || 'Range Medical <hello@range-medical.com>';
  const replyAddr = replyTo || null;

  // Save campaign record
  const { data: campaignRow, error: cErr } = await supabase
    .from('email_campaigns')
    .insert({
      name: name || `Campaign ${new Date().toLocaleDateString()}`,
      subject,
      html_body: htmlBody,
      segment_snapshot: filters || {},
      from_email: fromAddr,
      reply_to: replyAddr,
      status: 'sending',
      total_recipients: recipients.length,
    })
    .select()
    .single();
  if (cErr) throw cErr;

  // Send emails one at a time with delay to avoid Resend 429 rate limits
  let sentCount = 0;
  let errorCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    const patient = recipients[i];

    try {
      const sendPayload = {
        from: fromAddr,
        to: patient.email,
        subject,
        html: htmlBody,
      };
      if (replyAddr) sendPayload.reply_to = replyAddr;

      const sendResult = await resend.emails.send(sendPayload);

      // Resend SDK returns { data, error } — check for error response
      if (sendResult?.error) {
        const errMsg = sendResult.error.message || JSON.stringify(sendResult.error);
        throw new Error(errMsg);
      }

      const resendEmailId = sendResult?.data?.id || sendResult?.id || null;

      // Log to comms_log
      await logComm({
        channel: 'email',
        messageType: 'campaign',
        message: subject,
        source: 'email-campaigns',
        patientId: patient.id,
        patientName: patient.name,
        recipient: patient.email,
        subject,
        status: 'sent',
        htmlBody,
      });

      // Track recipient with Resend ID
      await supabase.from('email_campaign_recipients').insert({
        campaign_id: campaignRow.id,
        patient_id: patient.id,
        email: patient.email,
        status: 'sent',
        resend_email_id: resendEmailId,
        sent_at: new Date().toISOString(),
      });

      sentCount++;
    } catch (err) {
      const errMsg = err.message || 'Unknown error';
      await supabase.from('email_campaign_recipients').insert({
        campaign_id: campaignRow.id,
        patient_id: patient.id,
        email: patient.email,
        status: 'error',
        error_message: errMsg,
      });

      await logComm({
        channel: 'email',
        messageType: 'campaign',
        message: subject,
        source: 'email-campaigns',
        patientId: patient.id,
        patientName: patient.name,
        recipient: patient.email,
        subject,
        status: 'error',
        errorMessage: errMsg,
      });

      errorCount++;
    }

    // Rate limit: ~2 emails/sec to stay well under Resend limits
    if (i < recipients.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }

    // Update progress every 10 emails
    if ((i + 1) % 10 === 0 || i === recipients.length - 1) {
      await supabase
        .from('email_campaigns')
        .update({ sent_count: sentCount, error_count: errorCount })
        .eq('id', campaignRow.id);
    }
  }

  // Mark campaign complete
  const finalStatus = errorCount === recipients.length ? 'failed' : 'sent';
  await supabase
    .from('email_campaigns')
    .update({
      status: finalStatus,
      sent_count: sentCount,
      error_count: errorCount,
      sent_at: new Date().toISOString(),
    })
    .eq('id', campaignRow.id);

  return res.json({
    success: true,
    campaignId: campaignRow.id,
    sent: sentCount,
    errors: errorCount,
    total: recipients.length,
  });
}
