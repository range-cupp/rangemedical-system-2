// pages/api/roadmap/submit.js
// Handles /roadmap funnel submissions
// Saves lead, upserts patient, inserts pipeline, sends SMS/email, creates task

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { insertIntoPipeline } from '../../../lib/pipeline-insert';

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
  injury: 'Injury Recovery',
  energy: 'Energy / Hormones / Weight',
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
      missingOut,
      successVision,
      costOfWaiting,
      urgency,
      consentSms,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !path) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['injury', 'energy'].includes(path)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    const capFirst = capitalizeName(firstName);
    const capLast = capitalizeName(lastName);
    const normalizedEmail = email.toLowerCase().trim();
    const urgencyVal = parseInt(urgency, 10) || 0;
    const scoreTier = urgencyVal >= 7 ? 'assessment' : 'nurture';
    const tags = [`roadmap-${path}`, `roadmap-${scoreTier}`];

    // 1. Save to roadmap_leads
    let savedLead = null;
    if (supabase) {
      const { data, error: dbError } = await supabase
        .from('roadmap_leads')
        .insert([{
          first_name: capFirst,
          last_name: capLast,
          email: normalizedEmail,
          phone,
          path,
          missing_out: Array.isArray(missingOut) ? missingOut : [],
          success_vision: successVision || null,
          cost_of_waiting: costOfWaiting || null,
          urgency: urgencyVal || null,
          score_tier: scoreTier,
          consent_sms: consentSms || false,
          tags,
          status: 'new',
          nurture_sequence_started_at: scoreTier === 'nurture' ? new Date().toISOString() : null,
        }])
        .select()
        .single();

      if (dbError) {
        console.error('roadmap_leads insert error:', dbError);
      } else {
        savedLead = data;
      }
    }

    // 2. Upsert patient
    let patientId = null;
    if (supabase) {
      try {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id, tags')
          .eq('email', normalizedEmail)
          .maybeSingle();

        const patientTags = ['roadmap-lead', `roadmap-${path}`, `roadmap-${scoreTier}`];

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

    // 3. Sales pipeline
    await insertIntoPipeline({
      first_name: capFirst,
      last_name: capLast,
      email: normalizedEmail,
      phone,
      source: 'roadmap_funnel',
      lead_type: 'roadmap',
      lead_id: savedLead?.id || null,
      patient_id: patientId || null,
      path,
      notes: successVision ? `Success vision: ${successVision}` : null,
      urgency: urgencyVal || null,
    });

    // 4. Auto-text — only for assessment-tier (7-10), or always with consent
    if (consentSms && phone) {
      try {
        const normalized = normalizePhone(phone);
        let message;
        if (scoreTier === 'assessment') {
          message = `Thanks ${capFirst} — your roadmap is ready.\n\nYou said you're ready to solve this now. The fastest path is your Range Assessment: 45 min with a provider, real plan, $197 credited back toward treatment.\n\nBook here:\nhttps://range-medical.com/assessment?from=roadmap\n\n- Range Medical`;
        } else {
          message = `Thanks ${capFirst} — your 6-month roadmap is in your email.\n\nTake your time with it. When you're ready to make it real, we'll be here.\n\n- Range Medical`;
        }

        const smsResult = await sendSMS({ to: normalized, message });

        if (supabase && savedLead) {
          await supabase
            .from('roadmap_leads')
            .update({ status: 'texted' })
            .eq('id', savedLead.id);
        }

        await logComm({
          channel: 'sms',
          messageType: 'roadmap_auto',
          message,
          source: 'roadmap-submit',
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

    // 5. Team notification email
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

      const missingOutList = Array.isArray(missingOut) && missingOut.length
        ? missingOut.map((m) => `<li style="padding:3px 0;">${m}</li>`).join('')
        : '<li style="color:#a3a3a3;">None selected</li>';

      const tierBadgeColor = scoreTier === 'assessment' ? '#16a34a' : '#737373';
      const tierBadgeBg = scoreTier === 'assessment' ? '#f0fdf4' : '#fafafa';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#000;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">New Roadmap Lead</h1>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <span style="display:inline-block;background:${path === 'injury' ? '#fef2f2' : '#f0fdf4'};color:${path === 'injury' ? '#dc2626' : '#16a34a'};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding:6px 12px;border-radius:4px;margin-right:6px;">
            ${pathLabel}
          </span>
          <span style="display:inline-block;background:${tierBadgeBg};color:${tierBadgeColor};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding:6px 12px;border-radius:4px;">
            ${scoreTier === 'assessment' ? 'Ready for Assessment' : 'Nurture (1-6)'}
          </span>
          <p style="margin:8px 0 0;font-size:13px;color:#737373;">${date}</p>
        </td></tr>

        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:0.05em;">Contact</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
            <tr><td style="padding:8px 0;color:#737373;width:120px;">Name:</td><td style="padding:8px 0;color:#171717;font-weight:600;">${capFirst} ${capLast}</td></tr>
            <tr><td style="padding:8px 0;color:#737373;">Email:</td><td style="padding:8px 0;"><a href="mailto:${normalizedEmail}" style="color:#171717;">${normalizedEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#737373;">Phone:</td><td style="padding:8px 0;"><a href="tel:${phone}" style="color:#171717;">${phone}</a></td></tr>
            <tr><td style="padding:8px 0;color:#737373;">Urgency:</td><td style="padding:8px 0;color:#171717;font-weight:700;">${urgencyVal}/10</td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>

        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:0.05em;">Missing Out On</h2>
          <ul style="margin:0;padding-left:18px;font-size:14px;color:#171717;line-height:1.6;">${missingOutList}</ul>
        </td></tr>

        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>

        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:0.05em;">6-Month Success Vision</h2>
          <p style="margin:0;padding:12px 16px;background:#fafafa;border-left:3px solid #171717;font-size:14px;color:#171717;line-height:1.6;font-style:italic;">${successVision || '(not provided)'}</p>
        </td></tr>

        <tr><td style="padding:0 32px 24px;">
          <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:0.05em;">Cost of Waiting</h2>
          <p style="margin:0;padding:12px 16px;background:#fafafa;border-left:3px solid #dc2626;font-size:14px;color:#171717;line-height:1.6;font-style:italic;">${costOfWaiting || '(not provided)'}</p>
        </td></tr>

        <tr><td style="background:#fafafa;padding:20px 32px;text-align:center;border-top:1px solid #e5e5e5;">
          <p style="margin:0;font-size:13px;color:#737373;">Range Medical — Roadmap Funnel</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await resend.emails.send({
        from: 'Range Medical <notifications@range-medical.com>',
        to: 'intake@range-medical.com',
        subject: `Roadmap Lead (${scoreTier === 'assessment' ? 'READY' : 'Nurture'}): ${capFirst} ${capLast} — ${urgencyVal}/10`,
        html: emailHtml,
      });
    } catch (emailErr) {
      console.error('Team email error:', emailErr);
    }

    // 6. Patient-facing roadmap email
    try {
      const patientHtml = buildPatientRoadmapEmail({
        firstName: capFirst,
        path,
        missingOut: Array.isArray(missingOut) ? missingOut : [],
        successVision,
        urgency: urgencyVal,
        scoreTier,
      });

      await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        to: normalizedEmail,
        subject: `${capFirst}, here's your 6-month roadmap.`,
        html: patientHtml,
      });

      if (supabase && savedLead) {
        await supabase
          .from('roadmap_leads')
          .update({ status: 'emailed' })
          .eq('id', savedLead.id);
      }
    } catch (patientEmailErr) {
      console.error('Patient email error:', patientEmailErr);
    }

    // 7. Create task for Damon — higher priority if assessment tier
    if (supabase) {
      try {
        const { data: damon } = await supabase
          .from('employees')
          .select('id')
          .eq('email', 'damon@range-medical.com')
          .single();

        if (damon) {
          const missingOutStr = Array.isArray(missingOut) && missingOut.length
            ? missingOut.join(', ')
            : 'None selected';

          await supabase.from('tasks').insert({
            title: `Roadmap Lead (${scoreTier === 'assessment' ? 'READY' : 'Nurture'}): ${capFirst} ${capLast} — ${urgencyVal}/10`,
            description: `${capFirst} ${capLast} completed the roadmap funnel.
Path: ${PATH_LABELS[path]}
Phone: ${phone}
Email: ${normalizedEmail}
Urgency: ${urgencyVal}/10 (${scoreTier})

Missing out: ${missingOutStr}

6-month success: ${successVision || 'Not provided'}

Cost of waiting: ${costOfWaiting || 'Not provided'}`,
            assigned_to: damon.id,
            assigned_by: damon.id,
            patient_id: patientId || null,
            patient_name: `${capFirst} ${capLast}`,
            priority: scoreTier === 'assessment' ? 'high' : 'medium',
            status: 'pending',
          });
        }
      } catch (taskErr) {
        console.error('Task creation error:', taskErr);
      }
    }

    return res.status(200).json({
      success: true,
      leadId: savedLead?.id,
      scoreTier,
    });
  } catch (error) {
    console.error('Roadmap submit error:', error);
    return res.status(500).json({ error: 'Failed to submit' });
  }
}

// Patient-facing email — recap + roadmap
function buildPatientRoadmapEmail({ firstName, path, missingOut, successVision, urgency, scoreTier }) {
  const content = PATIENT_EMAIL_CONTENT[path];
  const missingList = missingOut.length
    ? missingOut.map((m) => `<li style="padding:4px 0;color:#525252;">${m}</li>`).join('')
    : '<li style="color:#a3a3a3;">(none)</li>';

  const interventions = content.interventions
    .map((iv) => `
      <tr><td style="padding:16px 0;border-top:1px solid #e5e5e5;">
        <div style="font-weight:700;color:#171717;margin-bottom:4px;font-size:15px;">${iv.name}</div>
        <div style="color:#737373;font-size:14px;line-height:1.55;">${iv.detail}</div>
      </td></tr>
    `).join('');

  const phases = content.phases
    .map((p) => `
      <td style="padding:16px;border:1px solid #e5e5e5;vertical-align:top;width:33.3%;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#737373;margin-bottom:6px;">${p.label}</div>
        <div style="font-size:13px;color:#171717;line-height:1.5;">${p.text}</div>
      </td>
    `).join('');

  const ctaBlock = scoreTier === 'assessment' ? `
    <tr><td style="padding:0 32px 32px;">
      <div style="background:#16a34a;padding:28px 24px;color:#fff;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#bbf7d0;margin-bottom:10px;">Your Next Step</div>
        <div style="font-size:20px;font-weight:900;margin-bottom:10px;line-height:1.2;">Book your Range Assessment.</div>
        <div style="font-size:14px;line-height:1.6;margin-bottom:20px;color:#f0fdf4;">
          You said you're ready. This is how we turn your roadmap into a real plan.
          45 minutes with a provider. $197 — credited toward treatment if you move forward.
        </div>
        <a href="https://range-medical.com/assessment?from=roadmap" style="display:inline-block;background:#fff;color:#16a34a;padding:14px 28px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
          Book My Assessment →
        </a>
      </div>
    </td></tr>
  ` : `
    <tr><td style="padding:0 32px 32px;">
      <div style="background:#fafafa;border:1px solid #e5e5e5;padding:28px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#737373;margin-bottom:10px;">When You're Ready</div>
        <div style="font-size:18px;font-weight:900;color:#171717;margin-bottom:10px;line-height:1.2;">The Range Assessment is the next step.</div>
        <div style="font-size:14px;line-height:1.6;margin-bottom:20px;color:#525252;">
          No pressure. We'll send you more over the next couple weeks to help you understand your path.
          When you're ready to move, book here.
        </div>
        <a href="https://range-medical.com/assessment?from=roadmap" style="display:inline-block;background:#171717;color:#fff;padding:14px 28px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
          Learn About the Assessment →
        </a>
      </div>
    </td></tr>
  `;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;color:#171717;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;max-width:640px;">
        <tr><td style="background:#171717;padding:32px;">
          <div style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;">Range Medical</div>
          <div style="color:#a3a3a3;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin-top:4px;">Your 6-Month Roadmap</div>
        </td></tr>

        <tr><td style="padding:40px 32px 16px;">
          <h1 style="margin:0 0 12px;font-size:28px;font-weight:900;line-height:1.1;letter-spacing:-0.02em;text-transform:uppercase;">Here's your 6-month path, ${firstName}.</h1>
          <p style="margin:0;font-size:15px;color:#525252;line-height:1.6;">
            Based on what you told us, here's what we'd build you toward — and how we'd get there.
          </p>
        </td></tr>

        <tr><td style="padding:24px 32px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#737373;margin-bottom:10px;">What You Said You're Missing</div>
          <ul style="margin:0 0 24px;padding-left:18px;font-size:14px;line-height:1.6;">${missingList}</ul>
          ${successVision ? `
            <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#737373;margin-bottom:10px;">What Success Looks Like</div>
            <div style="padding:14px 18px;background:#fafafa;border-left:3px solid #171717;font-size:14px;color:#171717;line-height:1.6;font-style:italic;margin-bottom:24px;">"${successVision}"</div>
          ` : ''}
        </td></tr>

        <tr><td style="padding:0 32px 24px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#737373;margin-bottom:10px;">What's Actually Going On</div>
          <p style="margin:0;font-size:15px;color:#525252;line-height:1.65;">${content.rootCause}</p>
        </td></tr>

        <tr><td style="padding:0 32px 24px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#737373;margin-bottom:10px;">The Tools That Work</div>
          <table width="100%" cellpadding="0" cellspacing="0">${interventions}</table>
        </td></tr>

        <tr><td style="padding:0 32px 24px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#737373;margin-bottom:10px;">Your Timeline</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${phases}</tr></table>
        </td></tr>

        <tr><td style="padding:0 32px 24px;">
          <div style="background:#171717;padding:24px;color:#fff;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#a3a3a3;margin-bottom:8px;">The Piece You Can't Do Alone</div>
            <p style="margin:0;font-size:15px;line-height:1.65;color:#fff;">${content.missingPiece}</p>
          </div>
        </td></tr>

        ${ctaBlock}

        <tr><td style="background:#fafafa;padding:24px 32px;border-top:1px solid #e5e5e5;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;color:#737373;">Range Medical · Newport Beach, CA</p>
          <p style="margin:0;font-size:12px;color:#a3a3a3;">Questions? Just reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const PATIENT_EMAIL_CONTENT = {
  injury: {
    rootCause:
      "Slow recovery is almost never one thing. It's a stack: inflammation load, cellular energy capacity, and peptide signaling that isn't firing the way it should. When you treat one and miss the others, you plateau.",
    interventions: [
      { name: 'Regenerative Peptides (BPC-157, TB4)', detail: 'Directly accelerate tissue repair — tendon, ligament, soft tissue, gut lining. Usually the first lever we pull.' },
      { name: 'Hyperbaric Oxygen (HBOT)', detail: 'Floods tissue with oxygen at pressure. Cuts recovery timelines roughly in half for soft-tissue injuries.' },
      { name: 'Red Light Therapy', detail: 'Mitochondrial stimulation at the cellular level. Pairs with HBOT and peptides to amplify healing.' },
      { name: 'Targeted Injections (PRP, Exosomes)', detail: "For stubborn joints, tendons, or old injuries that peptides alone can't resolve. Not needed for everyone." },
    ],
    phases: [
      { label: 'Weeks 1-4', text: 'Reduce inflammation, kickstart repair with peptides + HBOT/RLT.' },
      { label: 'Weeks 5-12', text: 'Rebuild capacity. Layer in strength, targeted injections if needed.' },
      { label: 'Months 4-6', text: 'Return to full performance. Maintenance protocol, prevent re-injury.' },
    ],
    missingPiece:
      "You can't self-diagnose which stack fits your specific injury. You need a provider who examines you, reviews your imaging, and builds a protocol around your timeline.",
  },
  energy: {
    rootCause:
      "Energy, weight, and how you feel are almost always a hormone-metabolism-mitochondria problem — usually layered. Testosterone drops, thyroid drifts, insulin resistance builds, cellular energy production slows. You feel all of it at once and it gets blamed on 'getting older.'",
    interventions: [
      { name: 'Hormone Replacement (HRT)', detail: "Testosterone, thyroid, and supporting hormones — dialed to your labs, not a stock dose. This is the foundation for most of what you're feeling." },
      { name: 'Weight Loss Medication (Tirzepatide, Retatrutide)', detail: 'GLP-1s actually work. Paired with the right nutrition and hormones, weight comes off and stays off.' },
      { name: 'Peptide Therapy', detail: 'Targeted peptides for energy, recovery, sleep, cognition. Layers on top of HRT for patients who want more.' },
      { name: 'IV Therapy + NAD', detail: 'Cellular-level support. NAD for energy, IVs for hydration, nutrients, and targeted deficits.' },
    ],
    phases: [
      { label: 'Weeks 1-2', text: 'Labs drawn, full workup reviewed. Baseline established.' },
      { label: 'Weeks 3-8', text: 'Protocol starts — HRT, GLP-1, or peptides based on your labs.' },
      { label: 'Months 3-6', text: 'Dial in. Adjust doses, re-check labs, add layers. You feel the shift.' },
    ],
    missingPiece:
      "You can't guess which systems are off. An Essential or Elite lab panel shows exactly what's happening — and a provider review turns that data into a plan you can actually execute.",
  },
};
