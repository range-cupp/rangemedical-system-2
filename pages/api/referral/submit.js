import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const INTEREST_LABELS = {
  peptides_recovery: 'Peptides & Recovery',
  hormone_optimization: 'Hormone Optimization',
  weight_loss: 'Weight Loss & Body Composition',
  energy_performance: 'Energy & Performance',
  not_sure: 'Not sure yet — just wants to learn more',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { first_name, last_name, phone, email, partner_slug, interests, notes } = req.body;

  // Validate required fields
  if (!first_name || !last_name || !phone || !email || !partner_slug) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify partner exists and is active
    const { data: partner, error: partnerError } = await supabase
      .from('referral_partners')
      .select('id, name, assigned_to')
      .eq('slug', partner_slug)
      .eq('active', true)
      .maybeSingle();

    if (partnerError) throw partnerError;
    if (!partner) {
      return res.status(404).json({ error: 'Referral partner not found or inactive' });
    }

    // Insert lead
    const { error: insertError } = await supabase
      .from('referral_leads')
      .insert({
        partner_id: partner.id,
        partner_slug,
        first_name,
        last_name,
        phone,
        email,
        interests: interests || [],
        notes: notes || null,
        status: 'new',
      });

    if (insertError) throw insertError;

    // Send notification email
    const interestList = (interests || [])
      .map(i => INTEREST_LABELS[i] || i)
      .join(', ');

    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <div style="border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="font-size: 18px; font-weight: 700; margin: 0;">New Referral from ${partner.name}</h1>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #666; width: 120px; vertical-align: top;">Name</td>
            <td style="padding: 10px 12px; font-size: 14px;">${first_name} ${last_name}</td>
          </tr>
          <tr style="background: #fafafa;">
            <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #666; vertical-align: top;">Phone</td>
            <td style="padding: 10px 12px; font-size: 14px;"><a href="tel:${phone}" style="color: #1a1a1a; text-decoration: none;">${phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #666; vertical-align: top;">Email</td>
            <td style="padding: 10px 12px; font-size: 14px;"><a href="mailto:${email}" style="color: #1a1a1a; text-decoration: none;">${email}</a></td>
          </tr>
          <tr style="background: #fafafa;">
            <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #666; vertical-align: top;">Interests</td>
            <td style="padding: 10px 12px; font-size: 14px;">${interestList || 'None selected'}</td>
          </tr>
          ${notes ? `
          <tr>
            <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #666; vertical-align: top;">Notes</td>
            <td style="padding: 10px 12px; font-size: 14px;">${notes}</td>
          </tr>
          ` : ''}
          <tr style="background: #fafafa;">
            <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #666; vertical-align: top;">Submitted</td>
            <td style="padding: 10px 12px; font-size: 14px;">${now}</td>
          </tr>
        </table>

        <div style="border-top: 1px solid #e0e0e0; padding-top: 16px; font-size: 13px; color: #666; font-style: italic;">
          This is a warm referral. Treat accordingly.
        </div>
      </div>
    `;

    // Tag in CRM — if patient exists by email or phone, set referral_source
    const referralTag = `Referral: ${partner.name}`;
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .or(`email.eq.${email},phone.ilike.%${phone.replace(/\D/g, '').slice(-10)}`)
      .maybeSingle();

    if (existingPatient) {
      await supabase.from('patients').update({ referral_source: referralTag }).eq('id', existingPatient.id);
    }

    await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: partner.assigned_to,
      cc: 'cupp@range-medical.com',
      subject: `New Referral from ${partner.name} — ${first_name} ${last_name}`,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Referral submit error:', err);
    return res.status(500).json({ error: 'Failed to submit referral' });
  }
}
