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
    const em = (email || '').trim().toLowerCase() || null;
    const normalized = normalizePhone(phone || '');
    const hasPhone = !!normalized;

    if (!fn) return res.status(400).json({ error: 'First name is required' });
    if (!ln) return res.status(400).json({ error: 'Last name is required' });
    if (!hasPhone && !em) {
      return res.status(400).json({ error: 'Phone or email is required' });
    }
    if (em && !em.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    let existing = null;
    const last10 = hasPhone ? normalized.replace(/\D/g, '').slice(-10) : '';

    // Prefer phone match (more reliable dedup key); fall back to email
    if (hasPhone) {
      const { data: phoneMatches, error: phoneErr } = await supabase
        .from('patients')
        .select('id, first_name, last_name, name, phone, email')
        .or(`phone.eq.${normalized},phone.ilike.%${last10}`)
        .limit(5);
      if (phoneErr) {
        console.error('find-or-create phone lookup error:', phoneErr);
        return res.status(500).json({ error: 'Lookup failed' });
      }
      existing = (phoneMatches || []).find(p => {
        const digits = (p.phone || '').replace(/\D/g, '').slice(-10);
        return digits === last10;
      }) || null;
    }

    if (!existing && em) {
      const { data: emailMatches, error: emailErr } = await supabase
        .from('patients')
        .select('id, first_name, last_name, name, phone, email')
        .ilike('email', em)
        .limit(1);
      if (emailErr) {
        console.error('find-or-create email lookup error:', emailErr);
        return res.status(500).json({ error: 'Lookup failed' });
      }
      existing = (emailMatches || [])[0] || null;
    }

    if (existing) {
      // Backfill missing fields on the existing patient record
      const updates = {};
      if (!existing.phone && hasPhone) updates.phone = normalized;
      if (!existing.email && em) updates.email = em;
      if (!existing.first_name && fn) updates.first_name = fn;
      if (!existing.last_name && ln) updates.last_name = ln;
      if (!existing.name && fn) updates.name = `${fn} ${ln}`.trim();

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from('patients')
          .update(updates)
          .eq('id', existing.id);
        if (updateErr) {
          console.error('find-or-create backfill error:', updateErr);
        } else {
          Object.assign(existing, updates);
        }
      }

      const displayName = existing.name
        || [existing.first_name, existing.last_name].filter(Boolean).join(' ').trim()
        || 'Patient';
      return res.status(200).json({
        isExisting: true,
        patient: {
          id: existing.id,
          name: displayName,
          first_name: existing.first_name || fn || null,
          last_name: existing.last_name || ln || null,
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
        phone: hasPhone ? normalized : null,
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
