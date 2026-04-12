import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateSlug(firstName, lastName) {
  // "Greg Smith" → "greg-s", if taken → "greg-s2", etc.
  const base = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const lastInitial = lastName ? lastName.charAt(0).toLowerCase() : '';
  return lastInitial ? `${base}-${lastInitial}` : base;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { first_name, last_name, phone, email } = req.body;

  if (!first_name || !last_name || !phone || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if this person is already a partner (by email)
    const { data: existing } = await supabase
      .from('referral_partners')
      .select('slug')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        success: true,
        slug: existing.slug,
        link: `https://range-medical.com/refer/${existing.slug}`,
        already_exists: true,
      });
    }

    // Generate unique slug
    let slug = generateSlug(first_name, last_name);
    let attempt = 0;
    let unique = false;

    while (!unique) {
      const testSlug = attempt === 0 ? slug : `${slug}${attempt + 1}`;
      const { data: collision } = await supabase
        .from('referral_partners')
        .select('id')
        .eq('slug', testSlug)
        .maybeSingle();

      if (!collision) {
        slug = testSlug;
        unique = true;
      } else {
        attempt++;
      }
    }

    const displayName = first_name.charAt(0).toUpperCase() + first_name.slice(1);

    // Create partner
    const { error: insertError } = await supabase
      .from('referral_partners')
      .insert({
        slug,
        name: displayName,
        partner_type: 'patient',
        assigned_to: 'damon@range-medical.com',
        email,
        phone,
        full_name: `${first_name} ${last_name}`,
        headline: `${displayName} thinks you should check this out.`,
        subheadline: "Here's what we actually do for people who want to perform at a higher level and feel better.",
        active: true,
      });

    if (insertError) throw insertError;

    const link = `https://range-medical.com/refer/${slug}`;

    // Auto-text them their link so it's always in their messages
    try {
      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone) {
        await sendSMS({
          to: normalizedPhone,
          message: `Hey ${displayName} — your referral link for Range Medical is ready:\n\n${link}\n\nRange Medical is a wellness medical clinic in Newport Beach. Just forward this link or text it to anyone you think should check us out. When they fill out the form, our team reaches out to them within 24 hours.\n\nTo find this link later, search your texts for "Range Medical" or go to range-medical.com/refer/join and enter your email.`,
          log: {
            messageType: 'referral_link',
            source: 'referral-create-partner',
          },
        });
      }
    } catch (smsErr) {
      // Don't fail the signup if SMS fails
      console.error('Failed to text referral link:', smsErr);
    }

    return res.status(200).json({
      success: true,
      slug,
      link,
      name: displayName,
    });
  } catch (err) {
    console.error('Create partner error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
