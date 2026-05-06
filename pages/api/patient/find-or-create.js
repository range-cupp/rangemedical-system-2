// /pages/api/patient/find-or-create.js
// Find an existing patient by phone, or create a new one with first/last/phone/email.
// Used by the Send Forms flows so every send has an associated patient profile.

import { createClient } from '@supabase/supabase-js';
import { normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, phone, email } = req.body || {};

    const fn = (firstName || '').trim();
    const ln = (lastName || '').trim();
    const em = (email || '').trim() || null;
    const normalized = normalizePhone(phone || '');

    if (!fn) return res.status(400).json({ error: 'First name is required' });
    if (!ln) return res.status(400).json({ error: 'Last name is required' });
    if (!normalized || normalized.length !== 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone is required' });
    }

    // Look up by phone — match either the normalized 10-digit form or any stored form ending in those digits
    const { data: matches, error: lookupErr } = await supabase
      .from('patients')
      .select('id, first_name, last_name, name, phone, email')
      .or(`phone.eq.${normalized},phone.ilike.%${normalized}`)
      .limit(5);

    if (lookupErr) {
      console.error('find-or-create lookup error:', lookupErr);
      return res.status(500).json({ error: 'Lookup failed' });
    }

    const existing = (matches || []).find(p => {
      const digits = (p.phone || '').replace(/\D/g, '').slice(-10);
      return digits === normalized;
    });

    if (existing) {
      const displayName = existing.name
        || [existing.first_name, existing.last_name].filter(Boolean).join(' ').trim()
        || 'Patient';
      return res.status(200).json({
        isExisting: true,
        patient: {
          id: existing.id,
          name: displayName,
          first_name: existing.first_name || null,
          last_name: existing.last_name || null,
          phone: existing.phone || null,
          email: existing.email || null,
        },
      });
    }

    const fullName = `${fn} ${ln}`.trim();
    const { data: created, error: insertErr } = await supabase
      .from('patients')
      .insert({
        first_name: fn,
        last_name: ln,
        name: fullName,
        full_name: fullName,
        phone: normalized,
        email: em,
        status: 'lead',
      })
      .select('id, first_name, last_name, name, phone, email')
      .single();

    if (insertErr) {
      console.error('find-or-create insert error:', insertErr);
      return res.status(500).json({ error: 'Failed to create patient' });
    }

    return res.status(200).json({
      isExisting: false,
      patient: {
        id: created.id,
        name: created.name || fullName,
        first_name: created.first_name,
        last_name: created.last_name,
        phone: created.phone,
        email: created.email,
      },
    });
  } catch (err) {
    console.error('find-or-create error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
