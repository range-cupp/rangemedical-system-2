// pages/api/start/submit.js
// Handles /start funnel form submissions
// Saves lead, creates/finds patient, sends auto-text, emails team, creates task

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { insertIntoPipeline } from '../../../lib/pipeline-insert';
import { notifyTaskAssignee } from '../../../lib/notify-task-assignee';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function capitalizeName(name) {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

const PATH_LABELS = {
  injury: 'Injury & Recovery',
  energy: 'Energy & Optimization',
  both: 'Injury + Energy (Both)',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      path,
      mainConcern,
      urgency,
      hasRecentLabs,
      labFileUrl,
      consentSms,
      referredBy,
    } = req.body;

    // Validate
    if (!firstName || !lastName || !email || !phone || !path) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['injury', 'energy', 'both'].includes(path)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    const capFirst = capitalizeName(firstName);
    const capLast = capitalizeName(lastName);
    const normalizedEmail = email.toLowerCase().trim();
    const tags = [`start-${path}`];
    if (referredBy) tags.push(`referred_by:${referredBy.trim()}`);

    // 1. Save to start_leads
    let savedLead = null;
    if (supabase) {
      const { data, error: dbError } = await supabase
        .from('start_leads')
        .insert([{
          first_name: capFirst,
          last_name: capLast,
          email: normalizedEmail,
          phone,
          path,
          main_concern: mainConcern || null,
          urgency: urgency || null,
          has_recent_labs: hasRecentLabs || false,
          lab_file_url: labFileUrl || null,
          consent_sms: consentSms || false,
          tags,
          status: 'new',
        }])
        .select()
        .single();

      if (dbError) {
        console.error('start_leads insert error:', dbError);
      } else {
        savedLead = data;
      }
    }

    // 2. Create or find patient record
    let patientId = null;
    if (supabase) {
      try {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id, tags')
          .eq('email', normalizedEmail)
          .maybeSingle();

        const patientTags = ['start-lead', `start-${path}`];

        if (existingPatient) {
          patientId = existingPatient.id;
          const existingTags = Array.isArray(existingPatient.tags) ? existingPatient.tags : [];
          const mergedTags = [...new Set([...existingTags, ...patientTags])];

          await supabase
            .from('patients')
            .update({ tags: mergedTags })
            .eq('id', patientId);
        } else {
          const { data: newPatient, error: patientError } = await supabase
            .from('patients')
            .insert({
              first_name: capFirst,
              last_name: capLast,
              name: `${capFirst} ${capLast}`,
              email: normalizedEmail,
              phone: phone || null,
              tags: patientTags,
            })
            .select('id')
            .single();

          if (patientError) {
            console.error('Patient creation error:', patientError);
          } else {
            patientId = newPatient.id;
          }
        }
      } catch (patientErr) {
        console.error('Patient upsert error:', patientErr);
      }
    }

    // Auto-add to sales pipeline
    await insertIntoPipeline({
      first_name: capFirst,
      last_name: capLast,
      email: normalizedEmail,
      phone,
      source: 'start_funnel',
      lead_type: 'start',
      lead_id: savedLead?.id || null,
      patient_id: patientId || null,
      path,
      notes: mainConcern || null,
      urgency: urgency ? parseInt(urgency) : null,
    });

    // 3. Send auto-text if they consented
    if (consentSms && phone) {
      try {
        const normalized = normalizePhone(phone);
        const nextStepUrl = 'https://range-medical.com/assessment';

        const message = `Got your info, ${capFirst}.\n\nYour next step is to book your $197 Range Assessment. We'll review your history, symptoms, and goals — then build your plan. If you move forward with treatment, the full $197 goes toward it.\n\nBook here:\n${nextStepUrl}\n\n- Range Medical`;

        const smsResult = await sendSMS({ to: normalized, message });

        // Update lead status
        if (supabase && savedLead) {
          await supabase
            .from('start_leads')
            .update({ status: 'texted' })
            .eq('id', savedLead.id);
        }

        // Log the SMS
        await logComm({
          channel: 'sms',
          messageType: 'start_funnel_auto',
          message,
          source: 'start-submit',
          patientId,
          patientName: `${capFirst} ${capLast}`,
          recipient: normalized,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
        });
      } catch (smsErr) {
        console.error('Auto-text error:', smsErr);
      }
    }

    // 4. Send email notification to team
    try {
      const pathLabel = PATH_LABELS[path] || path;
      const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
              timeZone: 'America/Los_Angeles',
      });

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#000;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">New Start Funnel Lead</h1>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <span style="display:inline-block;background:${path === 'injury' ? '#fef2f2' : path === 'energy' ? '#f0fdf4' : '#eff6ff'};color:${path === 'injury' ? '#dc2626' : path === 'energy' ? '#16a34a' : '#2563eb'};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding:6px 12px;border-radius:4px;">
            ${pathLabel}
          </span>
          <p style="margin:8px 0 0;font-size:13px;color:#737373;">${date}</p>
        </td></tr>

        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:0.05em;">Contact</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
            <tr><td style="padding:8px 0;color:#737373;">Name:</td><td style="padding:8px 0;color:#171717;font-weight:600;">${capFirst} ${capLast}</td></tr>
            <tr><td style="padding:8px 0;color:#737373;">Email:</td><td style="padding:8px 0;"><a href="mailto:${normalizedEmail}" style="color:#171717;">${normalizedEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#737373;">Phone:</td><td style="padding:8px 0;"><a href="tel:${phone}" style="color:#171717;">${phone}</a></td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>

        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:0.05em;">Details</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
            <tr><td style="padding:8px 0;color:#737373;">Main Concern:</td><td style="padding:8px 0;color:#171717;">${mainConcern || 'Not provided'}</td></tr>
            <tr><td style="padding:8px 0;color:#737373;">Urgency (1-10):</td><td style="padding:8px 0;color:#171717;font-weight:600;">${urgency || 'Not rated'}</td></tr>
            <tr><td style="padding:8px 0;color:#737373;">Has Recent Labs:</td><td style="padding:8px 0;color:#171717;">${hasRecentLabs ? 'Yes' : 'No'}</td></tr>
            ${labFileUrl ? `<tr><td style="padding:8px 0;color:#737373;">Lab File:</td><td style="padding:8px 0;"><a href="${labFileUrl}" style="color:#2563eb;">View uploaded file</a></td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#737373;">SMS Consent:</td><td style="padding:8px 0;color:#171717;">${consentSms ? 'Yes' : 'No'}</td></tr>
            ${referredBy ? `<tr><td style="padding:8px 0;color:#737373;">Referred By:</td><td style="padding:8px 0;color:#171717;font-weight:600;">${referredBy}</td></tr>` : ''}
          </table>
        </td></tr>

        <tr><td style="background:#fafafa;padding:20px 32px;text-align:center;border-top:1px solid #e5e5e5;">
          <p style="margin:0;font-size:13px;color:#737373;">Range Medical Start Funnel</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await resend.emails.send({
        from: 'Range Medical <notifications@range-medical.com>',
        to: 'intake@range-medical.com',
        subject: `New Start Lead (${pathLabel}): ${capFirst} ${capLast}`,
        html: emailHtml,
      });
    } catch (emailErr) {
      console.error('Email notification error:', emailErr);
    }

    // 5. Create follow-up task for Damon
    if (supabase) {
      try {
        const { data: damon } = await supabase
          .from('employees')
          .select('id')
          .eq('email', 'damon@range-medical.com')
          .single();

        if (damon) {
          const taskTitle = `New Start Lead: ${capFirst} ${capLast} (${PATH_LABELS[path]})`;
          const taskPriority = urgency >= 8 ? 'high' : 'medium';
          await supabase.from('tasks').insert({
            title: taskTitle,
            description: `${capFirst} ${capLast} submitted the Start Here form.\nPath: ${PATH_LABELS[path]}\nPhone: ${phone}\nEmail: ${normalizedEmail}\nConcern: ${mainConcern || 'Not provided'}\nUrgency: ${urgency}/10${referredBy ? `\nReferred by: ${referredBy}` : ''}`,
            assigned_to: damon.id,
            assigned_by: damon.id,
            patient_id: patientId || null,
            patient_name: `${capFirst} ${capLast}`,
            priority: taskPriority,
            status: 'pending',
          });
          notifyTaskAssignee(damon.id, {
            assignerName: 'Range Medical',
            taskTitle,
            priority: taskPriority,
          }).catch(err => console.error('Start task SMS error:', err));
        }
      } catch (taskErr) {
        console.error('Task creation error:', taskErr);
      }
    }

    return res.status(200).json({
      success: true,
      leadId: savedLead?.id,
    });
  } catch (error) {
    console.error('Start submit error:', error);
    return res.status(500).json({ error: 'Failed to submit' });
  }
}
