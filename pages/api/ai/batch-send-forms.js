// /pages/api/ai/batch-send-forms.js
// Batch check and send consent forms for patients with appointments on a given date
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { createFormBundle, FORM_DEFINITIONS } from '../../../lib/form-bundles';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REQUIRED_BY_SERVICE = {
  general: ['intake', 'hipaa'],
  hrt: ['intake', 'hipaa', 'hrt', 'blood-draw'],
  weight_loss: ['intake', 'hipaa', 'weight-loss', 'blood-draw'],
  iv: ['intake', 'hipaa', 'iv'],
  peptide: ['intake', 'hipaa', 'peptide'],
  hbot: ['intake', 'hipaa', 'hbot'],
  rlt: ['intake', 'hipaa', 'red-light'],
  prp: ['intake', 'hipaa', 'prp', 'blood-draw'],
  injection: ['intake', 'hipaa'],
};

const PRIORITY_ORDER = ['intake', 'hipaa'];

function sortFormIds(formIds) {
  return formIds
    .filter(id => FORM_DEFINITIONS[id])
    .sort((a, b) => {
      const aIdx = PRIORITY_ORDER.indexOf(a);
      const bIdx = PRIORITY_ORDER.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
}

function generateFormsEmailHtml({ firstName, forms, bundleUrl }) {
  const formListHtml = forms.map(f => `
    <tr>
      <td style="padding: 6px 0; color: #404040; font-size: 14px;">
        &bull; ${f.name} <span style="color: #999;">(${f.time})</span>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forms from Range Medical</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px;">
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Forms to Complete</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Please complete the following form${forms.length > 1 ? 's' : ''} before your visit to Range Medical:</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
                                <tr>
                                    <td style="padding: 0;">
                                        <a href="${bundleUrl}" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 700; letter-spacing: 0.05em;">
                                            Complete Your Forms
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px; width: 100%;">
                                ${formListHtml}
                            </table>
                            <p style="margin: 0 0 8px; color: #666; font-size: 13px; line-height: 1.6;">Your information carries forward between forms so you only need to enter it once.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 30px; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Range Medical</p>
                            <p style="margin: 0; color: #999; font-size: 12px;">www.range-medical.com</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function getPacificDayBounds(dateStr) {
  const fakeUtc = Date.UTC(
    ...dateStr.split('-').map((v, i) => i === 1 ? +v - 1 : +v),
    0, 0, 0
  );
  const realUtc = new Date(fakeUtc);
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    f.formatToParts(realUtc).map(({ type, value }) => [type, value])
  );
  const ptFakeUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const offsetMs = ptFakeUtc - realUtc.getTime();
  const offsetMin = Math.round(offsetMs / 60000);
  const sign = offsetMin <= 0 ? '-' : '+';
  const abs = Math.abs(offsetMin);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  const offset = `${sign}${oh}:${om}`;
  return {
    start: `${dateStr}T00:00:00${offset}`,
    end: `${dateStr}T23:59:59${offset}`,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { date, service_category, send } = req.body;
  if (!date) return res.status(400).json({ error: 'date required (YYYY-MM-DD)' });

  try {
    const { start, end } = getPacificDayBounds(date);

    let query = supabase
      .from('appointments')
      .select('id, patient_id, patient_name, patient_phone, service_name, service_category, start_time, status')
      .gte('start_time', start)
      .lte('start_time', end)
      .not('status', 'eq', 'cancelled')
      .order('start_time', { ascending: true });

    if (service_category) {
      query = query.eq('service_category', service_category);
    }

    const { data: appointments, error: apptError } = await query;
    if (apptError) throw apptError;

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        date,
        service_category: service_category || 'all',
        total_appointments: 0,
        patients_needing_forms: [],
        patients_complete: [],
        no_email: [],
        summary: { needing_forms: 0, already_complete: 0, no_email: 0 },
      });
    }

    const uniquePatientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))];

    const [patientRes, consentRes] = await Promise.all([
      supabase.from('patients').select('id, first_name, last_name, email, phone').in('id', uniquePatientIds),
      supabase.from('consents').select('patient_id, consent_type, consent_given').in('patient_id', uniquePatientIds).eq('consent_given', true),
    ]);

    if (patientRes.error) throw patientRes.error;
    if (consentRes.error) throw consentRes.error;

    const patientMap = {};
    for (const p of (patientRes.data || [])) patientMap[p.id] = p;

    const consentsByPatient = {};
    for (const c of (consentRes.data || [])) {
      if (!consentsByPatient[c.patient_id]) consentsByPatient[c.patient_id] = new Set();
      consentsByPatient[c.patient_id].add(c.consent_type);
    }

    const seen = new Set();
    const patientsNeedingForms = [];
    const patientsComplete = [];
    const noEmail = [];

    for (const a of appointments) {
      if (!a.patient_id || seen.has(a.patient_id)) continue;
      seen.add(a.patient_id);

      const p = patientMap[a.patient_id];
      if (!p) continue;

      const svcCat = service_category || a.service_category || 'general';
      const required = REQUIRED_BY_SERVICE[svcCat] || REQUIRED_BY_SERVICE.general;
      const signed = consentsByPatient[a.patient_id] || new Set();
      const missing = required.filter(f => !signed.has(f));
      const patientName = a.patient_name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
      const apptTime = new Date(a.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });

      if (missing.length === 0) {
        patientsComplete.push({ patient_id: a.patient_id, patient_name: patientName, service_name: a.service_name, appointment_time: apptTime });
        continue;
      }

      if (!p.email) {
        noEmail.push({ patient_id: a.patient_id, patient_name: patientName, service_name: a.service_name, missing_count: missing.length });
        continue;
      }

      patientsNeedingForms.push({
        patient_id: a.patient_id,
        patient_name: patientName,
        first_name: p.first_name || '',
        patient_email: p.email,
        patient_phone: p.phone || null,
        service_category: svcCat,
        service_name: a.service_name,
        appointment_time: apptTime,
        missing_forms: missing,
        missing_form_names: missing.map(id => FORM_DEFINITIONS[id]?.name || id),
        signed_types: [...signed],
      });
    }

    if (!send) {
      return res.status(200).json({
        date,
        service_category: service_category || 'all',
        total_appointments: appointments.length,
        patients_needing_forms: patientsNeedingForms,
        patients_complete: patientsComplete,
        no_email: noEmail,
        summary: {
          needing_forms: patientsNeedingForms.length,
          already_complete: patientsComplete.length,
          no_email: noEmail.length,
        },
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const sent = [];
    const failed = [];

    for (const patient of patientsNeedingForms) {
      try {
        const validFormIds = sortFormIds(patient.missing_forms);
        if (validFormIds.length === 0) continue;

        const bundle = await createFormBundle({
          formIds: validFormIds,
          patientId: patient.patient_id,
          patientName: patient.patient_name,
          patientEmail: patient.patient_email,
          patientPhone: patient.patient_phone,
          metadata: { source: 'batch-send-forms' },
        });

        const validForms = validFormIds.map(id => ({ ...FORM_DEFINITIONS[id], id }));
        const html = generateFormsEmailHtml({
          firstName: patient.first_name || 'there',
          forms: validForms,
          bundleUrl: bundle.url,
        });

        const formNames = validForms.map(f => f.name).join(', ');
        const subject = validForms.length === 1
          ? `Please complete your ${validForms[0].name} — Range Medical`
          : `Forms to complete before your visit — Range Medical`;

        const { error: emailError } = await resend.emails.send({
          from: 'Range Medical <noreply@range-medical.com>',
          to: patient.patient_email,
          subject,
          html,
        });

        if (emailError) {
          failed.push({ patient_id: patient.patient_id, patient_name: patient.patient_name, error: emailError.message });
          continue;
        }

        await logComm({
          channel: 'email',
          messageType: 'form_links',
          message: `Forms sent via email (batch): ${formNames} (bundle: ${bundle.token})`,
          source: 'batch-send-forms',
          patientId: patient.patient_id,
          patientName: patient.patient_name,
          recipient: patient.patient_email,
          direction: 'outbound',
          subject,
        });

        sent.push({
          patient_id: patient.patient_id,
          patient_name: patient.patient_name,
          forms_sent: validFormIds.length,
          form_names: formNames,
        });
      } catch (err) {
        failed.push({ patient_id: patient.patient_id, patient_name: patient.patient_name, error: err.message });
      }
    }

    return res.status(200).json({
      date,
      service_category: service_category || 'all',
      sent,
      failed,
      skipped_no_email: noEmail,
      summary: {
        sent_count: sent.length,
        failed_count: failed.length,
        skipped_count: noEmail.length,
      },
    });
  } catch (err) {
    console.error('Batch send forms error:', err);
    return res.status(500).json({ error: 'Failed to process batch forms' });
  }
}
