// pages/api/energy-check/submit.js
// Handles Energy & Recovery Check quiz submissions
// Saves lead, sends results email + SMS, notifies team

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { getResultsEmailHtml } from '../../../lib/energy-check-emails';
import { insertIntoPipeline } from '../../../lib/pipeline-insert';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const SEVERITY_LABELS = {
  green: 'Low Concern',
  yellow: 'Moderate Concern',
  red: 'High Concern',
};

function capitalizeName(name) {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export default async function handler(req, res) {
  // DISABLED — energy check funnel turned off 2026-04-01
  return res.status(200).json({ disabled: true, reason: 'Energy check funnel disabled' });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      email,
      phone,
      primaryConcern,
      answers,
      score,
      severity,
      door,
      consentSms,
      source,
    } = req.body;

    if (!firstName || !email || !phone || !primaryConcern) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const capFirst = capitalizeName(firstName);
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Save to energy_check_leads
    let savedLead = null;
    if (supabase) {
      const { data, error: dbError } = await supabase
        .from('energy_check_leads')
        .insert([{
          first_name: capFirst,
          email: normalizedEmail,
          phone,
          primary_concern: primaryConcern,
          answers: answers || {},
          score: score || 0,
          severity: severity || 'yellow',
          door: door || primaryConcern,
          consent_sms: consentSms || false,
          source: source || 'direct',
          status: 'results_viewed',
          nurture_step: 1, // Step 1 = immediate results (sent now)
          last_nurture_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (dbError) {
        console.error('energy_check_leads insert error:', dbError);
      } else {
        savedLead = data;
      }
    }

    // 2. Find or create patient record
    let patientId = null;
    if (supabase) {
      try {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id, tags')
          .eq('email', normalizedEmail)
          .maybeSingle();

        const patientTags = ['energy-check-lead', `ec-${severity}`];

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
              last_name: '',
              name: capFirst,
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
      last_name: '',
      email: normalizedEmail,
      phone,
      source: 'energy_check',
      lead_type: 'energy_check',
      lead_id: savedLead?.id || null,
      patient_id: patientId || null,
      path: 'energy',
      notes: primaryConcern || null,
      urgency: score || null,
    });

    // 3. Send results email to lead
    try {
      const bookingUrl = `https://range-medical.com/start/energy?name=${encodeURIComponent(capFirst)}&from=energy-check`;

      const emailHtml = getResultsEmailHtml({
        firstName: capFirst,
        score,
        severity,
        bookingUrl,
        door,
      });

      await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        to: normalizedEmail,
        subject: `Your Energy & Recovery Score: ${SEVERITY_LABELS[severity] || 'Results Ready'}`,
        html: emailHtml,
      });

      await logComm({
        channel: 'email',
        messageType: 'energy_check_results',
        message: `Energy Check results email — score: ${score}, severity: ${severity}`,
        source: 'energy-check-submit',
        patientId,
        patientName: capFirst,
        recipient: normalizedEmail,
        subject: `Your Energy & Recovery Score: ${SEVERITY_LABELS[severity]}`,
        status: 'sent',
      });
    } catch (emailErr) {
      console.error('Results email error:', emailErr);
    }

    // 4. Send SMS with results link if they consented
    if (consentSms && phone) {
      try {
        const normalized = normalizePhone(phone);
        if (normalized) {
          const bookingUrl = `https://range-medical.com/start/energy?name=${encodeURIComponent(capFirst)}&from=energy-check`;

          const message = `Hey ${capFirst}, your Energy & Recovery Check results are in.\n\nYour score: ${score}/24 (${SEVERITY_LABELS[severity]})\n\nReady for the next step? Pick your lab panel here:\n${bookingUrl}\n\n- Range Medical`;

          const smsResult = await sendSMS({ to: normalized, message });

          await logComm({
            channel: 'sms',
            messageType: 'energy_check_results_sms',
            message,
            source: 'energy-check-submit',
            patientId,
            patientName: capFirst,
            recipient: normalized,
            status: smsResult.success ? 'sent' : 'error',
            errorMessage: smsResult.error || null,
            twilioMessageSid: smsResult.messageSid || null,
            provider: smsResult.provider || null,
          });
        }
      } catch (smsErr) {
        console.error('Results SMS error:', smsErr);
      }
    }

    // 5. Send staff notification email
    try {
      const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      const severityColor = severity === 'red' ? '#DC2626' : severity === 'yellow' ? '#D97706' : '#16A34A';

      const staffHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#000;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">New Energy Check Lead</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:14px;color:#737373;">${date}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;width:140px;">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:600;">${capFirst}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${normalizedEmail}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${phone}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Concern</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${primaryConcern}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Score</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:700;">
                ${score}/24
                <span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:700;color:#fff;background:${severityColor};margin-left:8px;">${(severity || '').toUpperCase()}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Source</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${source || 'direct'}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:14px;color:#737373;">SMS Consent</td>
              <td style="padding:10px 0;font-size:14px;">${consentSms ? 'Yes' : 'No'}</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        to: ['chris@range-medical.com', 'damon@range-medical.com'],
        subject: `Energy Check: ${capFirst} — ${(severity || '').toUpperCase()} (${score}/24)`,
        html: staffHtml,
      });
    } catch (staffEmailErr) {
      console.error('Staff notification email error:', staffEmailErr);
    }

    // 6. Create task for Damon
    if (supabase) {
      try {
        const { data: damon } = await supabase
          .from('employees')
          .select('id')
          .eq('email', 'damon@range-medical.com')
          .maybeSingle();

        if (damon) {
          const severityLabel = SEVERITY_LABELS[severity] || severity;
          const concernLabel = primaryConcern === 'energy' ? 'Energy'
            : primaryConcern === 'recovery' ? 'Recovery' : 'Both';

          await supabase.from('tasks').insert({
            title: `Energy Check Lead: ${capFirst} — ${severityLabel}`,
            description: `New Energy & Recovery Check lead.\n\nConcern: ${concernLabel}\nScore: ${score}/24 (${(severity || '').toUpperCase()})\nPhone: ${phone}\nEmail: ${normalizedEmail}\nSMS Consent: ${consentSms ? 'Yes' : 'No'}\nSource: ${source || 'direct'}`,
            assigned_to: damon.id,
            assigned_by: damon.id,
            patient_id: patientId || null,
            patient_name: capFirst,
            priority: severity === 'red' ? 'high' : 'medium',
            status: 'pending',
          });
        }
      } catch (taskErr) {
        console.error('Task creation error:', taskErr);
      }
    }

    return res.status(200).json({ success: true, leadId: savedLead?.id || null });
  } catch (err) {
    console.error('Energy check submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
