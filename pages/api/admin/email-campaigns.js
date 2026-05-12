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
      .select('id, patient_id, email, status, error_message, resend_email_id, sent_at, delivered_at, opened_at, clicked_at, bounced_at')
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

// Send campaign to all segment recipients using Resend batch API
async function sendCampaign(req, res, campaign) {
  const { name, subject, htmlBody, filters, fromEmail, replyTo } = campaign;

  if (!subject || !htmlBody) {
    return res.status(400).json({ error: 'Subject and email body are required' });
  }

  const patients = await querySegment(filters || {});
  const recipients = patients.filter(p => p.email);

  if (recipients.length === 0) {
    return res.status(400).json({ error: 'No recipients with email addresses in this segment' });
  }

  const fromAddr = fromEmail || 'Range Medical <info@range-medical.com>';
  const replyAddr = replyTo || null;

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

  let sentCount = 0;
  let errorCount = 0;
  const BATCH_SIZE = 100;

  for (let batchStart = 0; batchStart < recipients.length; batchStart += BATCH_SIZE) {
    const batch = recipients.slice(batchStart, batchStart + BATCH_SIZE);

    const emails = batch.map(patient => {
      const payload = { from: fromAddr, to: patient.email, subject, html: htmlBody };
      if (replyAddr) payload.reply_to = replyAddr;
      return payload;
    });

    try {
      const batchResult = await resend.batch.send(emails);

      if (batchResult?.error) {
        const errMsg = batchResult.error.message || JSON.stringify(batchResult.error);
        for (const patient of batch) {
          await supabase.from('email_campaign_recipients').insert({
            campaign_id: campaignRow.id,
            patient_id: patient.id,
            email: patient.email,
            status: 'error',
            error_message: errMsg,
          });
          errorCount++;
        }
      } else {
        const ids = batchResult?.data?.data || batchResult?.data || [];
        const now = new Date().toISOString();

        const recipientRows = batch.map((patient, idx) => ({
          campaign_id: campaignRow.id,
          patient_id: patient.id,
          email: patient.email,
          status: 'sent',
          resend_email_id: ids[idx]?.id || null,
          sent_at: now,
        }));

        await supabase.from('email_campaign_recipients').insert(recipientRows);

        const commRows = batch.map(patient => ({
          channel: 'email',
          message_type: 'campaign',
          message: subject,
          source: 'email-campaigns',
          patient_id: patient.id,
          patient_name: patient.name,
          recipient: patient.email,
          subject,
          status: 'sent',
        }));
        await supabase.from('comms_log').insert(commRows);

        sentCount += batch.length;
      }
    } catch (err) {
      const errMsg = err.message || 'Unknown error';
      const errorRows = batch.map(patient => ({
        campaign_id: campaignRow.id,
        patient_id: patient.id,
        email: patient.email,
        status: 'error',
        error_message: errMsg,
      }));
      await supabase.from('email_campaign_recipients').insert(errorRows);
      errorCount += batch.length;
    }

    await supabase
      .from('email_campaigns')
      .update({ sent_count: sentCount, error_count: errorCount })
      .eq('id', campaignRow.id);

    if (batchStart + BATCH_SIZE < recipients.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

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

export const config = {
  maxDuration: 300,
};
