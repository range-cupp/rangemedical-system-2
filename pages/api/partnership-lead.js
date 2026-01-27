// pages/api/partnership-lead.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Email notification settings
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFICATION_EMAIL = 'cupp@range-medical.com';

async function sendEmailNotification(lead) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured - skipping email notification');
    return;
  }

  const servicesHtml = lead.services_interested
    .map(s => `<li>${s}</li>`)
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #111; border-bottom: 2px solid #111; padding-bottom: 10px;">
        🎉 New ${lead.partner_name} Lead
      </h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 140px;">Name:</td>
          <td style="padding: 8px 0; font-weight: bold;">${lead.first_name} ${lead.last_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${lead.email}">${lead.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Phone:</td>
          <td style="padding: 8px 0;"><a href="tel:${lead.phone}">${lead.phone}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Discount:</td>
          <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">${lead.discount_code} OFF</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; vertical-align: top;">Interested In:</td>
          <td style="padding: 8px 0;">
            <ul style="margin: 0; padding-left: 20px;">${servicesHtml}</ul>
          </td>
        </tr>
        ${lead.health_goals ? `
        <tr>
          <td style="padding: 8px 0; color: #666; vertical-align: top;">Health Goals:</td>
          <td style="padding: 8px 0;">${lead.health_goals}</td>
        </tr>
        ` : ''}
        ${lead.referral_source ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Referred By:</td>
          <td style="padding: 8px 0;">${lead.referral_source}</td>
        </tr>
        ` : ''}
      </table>
      
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          This lead was submitted through the <strong>${lead.partner_name}</strong> partnership landing page.
          <br><br>
          <a href="tel:${lead.phone}" style="background: #111; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
            📞 Call Now
          </a>
        </p>
      </div>
    </div>
  `;

  try {
    // Note: Using Resend's default domain. To use your own domain (notifications@range-medical.com),
    // verify your domain in Resend dashboard: https://resend.com/domains
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Range Medical Leads <onboarding@resend.dev>',
        to: NOTIFICATION_EMAIL,
        subject: `🎉 New ${lead.partner_name} Lead: ${lead.first_name} ${lead.last_name}`,
        html: html
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
    } else {
      console.log('Email notification sent successfully');
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      services,
      goals,
      referral,
      trainerName,
      partner = 'Society OC',
      discount = '10%'
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!services || services.length === 0) {
      return res.status(400).json({ error: 'Please select at least one service' });
    }

    // Build referral source with trainer name if applicable
    let referralSource = referral || null;
    if (referral === 'Society OC Trainer' && trainerName) {
      referralSource = `Society OC Trainer: ${trainerName.trim()}`;
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('partnership_leads')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        services_interested: services,
        health_goals: goals?.trim() || null,
        referral_source: referralSource,
        partner_name: partner,
        discount_code: discount,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    // Send email notification
    await sendEmailNotification(data);

    console.log(`New ${partner} lead:`, data.id, `${firstName} ${lastName}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Lead captured successfully',
      id: data.id 
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
