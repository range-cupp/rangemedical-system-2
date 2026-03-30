// /pages/api/birthday/validate.js
// Validates a birthday gift token and returns patient info + gift status

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Look up gift by token
    const { data: gift, error } = await supabase
      .from('birthday_gifts')
      .select('id, patient_id, token, birth_month, birth_year, injection_type, status, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;

    if (!gift) {
      return res.status(404).json({ error: 'Gift not found', code: 'NOT_FOUND' });
    }

    // Check if already used
    if (gift.status === 'redeemed') {
      return res.status(200).json({ valid: false, code: 'ALREADY_REDEEMED', message: 'This birthday gift has already been redeemed.' });
    }

    if (gift.status === 'booked') {
      return res.status(200).json({ valid: false, code: 'ALREADY_BOOKED', message: 'You already have a birthday injection booked! Check your confirmation text for details.' });
    }

    // Check if expired (past the birthday month)
    if (new Date() > new Date(gift.expires_at)) {
      // Mark as expired if not already
      if (gift.status === 'active') {
        await supabase.from('birthday_gifts').update({ status: 'expired' }).eq('id', gift.id);
      }
      return res.status(200).json({ valid: false, code: 'EXPIRED', message: 'This birthday gift has expired. Birthday gifts are valid during your birthday month.' });
    }

    // Get patient info
    const { data: patient } = await supabase
      .from('patients')
      .select('id, first_name, name, email, phone')
      .eq('id', gift.patient_id)
      .single();

    const firstName = patient?.first_name || (patient?.name ? patient.name.split(' ')[0] : 'there');

    return res.status(200).json({
      valid: true,
      gift: {
        id: gift.id,
        birthMonth: gift.birth_month,
        status: gift.status,
      },
      patient: {
        firstName,
        name: patient?.name || '',
        email: patient?.email || '',
        phone: patient?.phone || '',
      },
    });
  } catch (error) {
    console.error('Birthday validate error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
