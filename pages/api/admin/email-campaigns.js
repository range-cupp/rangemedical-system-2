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
  if (req.method === 'GET') return listCampaigns(req, res);
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
  const { name, subject, htmlBody, filters } = campaign;

  if (!subject || !htmlBody) {
    return res.status(400).json({ error: 'Subject and email body are required' });
  }

  // Get recipients from segment
  const patients = await querySegment(filters || {});
  const recipients = patients.filter(p => p.email);

  if (recipients.length === 0) {
    return res.status(400).json({ error: 'No recipients with email addresses in this segment' });
  }

  // Save campaign record
  const { data: campaignRow, error: cErr } = await supabase
    .from('email_campaigns')
    .insert({
      name: name || `Campaign ${new Date().toLocaleDateString()}`,
      subject,
      html_body: htmlBody,
      segment_snapshot: filters || {},
      status: 'sending',
      total_recipients: recipients.length,
    })
    .select()
    .single();
  if (cErr) throw cErr;

  // Send emails in batches of 10 (Resend rate limit friendly)
  let sentCount = 0;
  let errorCount = 0;
  const BATCH_SIZE = 10;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (patient) => {
        try {
          await resend.emails.send({
            from: 'Range Medical <noreply@rangemedical.com>',
            to: patient.email,
            subject,
            html: htmlBody,
          });

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

          // Track recipient
          await supabase.from('email_campaign_recipients').insert({
            campaign_id: campaignRow.id,
            patient_id: patient.id,
            email: patient.email,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });

          return { success: true };
        } catch (err) {
          await supabase.from('email_campaign_recipients').insert({
            campaign_id: campaignRow.id,
            patient_id: patient.id,
            email: patient.email,
            status: 'error',
            error_message: err.message,
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
            errorMessage: err.message,
          });

          return { success: false, error: err.message };
        }
      })
    );

    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value.success) sentCount++;
      else errorCount++;
    });

    // Update progress
    await supabase
      .from('email_campaigns')
      .update({ sent_count: sentCount, error_count: errorCount })
      .eq('id', campaignRow.id);
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
