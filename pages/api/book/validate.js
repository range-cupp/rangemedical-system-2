// /pages/api/book/validate.js
// Validates a protocol access_token and returns patient info + active in-clinic protocols

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map protocol program_type to Cal.com event slug and display info
const PROTOCOL_BOOKING_MAP = {
  hrt: {
    slug: 'injection-testosterone',
    label: 'Testosterone Injection',
    subtitle: 'HRT Protocol',
    icon: '\u{1F4AA}',
    duration: '~5 min',
  },
  weight_loss: {
    slug: 'injection-weight-loss',
    label: 'Weight Loss Injection',
    subtitle: 'GLP-1 Protocol',
    icon: '\u2696\uFE0F',
    duration: '~5 min',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Look up active in-clinic protocols with this access_token
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('id, patient_id, program_type, medication, delivery_method, status, patient_name, visit_frequency')
      .eq('access_token', token)
      .eq('status', 'active')
      .eq('delivery_method', 'in_clinic');

    if (error) throw error;

    if (!protocols || protocols.length === 0) {
      // Check if token exists but protocol is not active/in_clinic
      const { data: anyProtocol } = await supabase
        .from('protocols')
        .select('id, status, delivery_method')
        .eq('access_token', token)
        .limit(1)
        .maybeSingle();

      if (anyProtocol) {
        if (anyProtocol.status !== 'active') {
          return res.status(200).json({ valid: false, code: 'INACTIVE', message: 'This protocol is no longer active.' });
        }
        if (anyProtocol.delivery_method !== 'in_clinic') {
          return res.status(200).json({ valid: false, code: 'NOT_IN_CLINIC', message: 'This protocol is set up for take-home delivery.' });
        }
      }

      return res.status(404).json({ error: 'Booking link not found', code: 'NOT_FOUND' });
    }

    const patientId = protocols[0].patient_id;

    // Get patient info
    const { data: patient } = await supabase
      .from('patients')
      .select('id, first_name, name, email, phone')
      .eq('id', patientId)
      .single();

    const firstName = patient?.first_name || (patient?.name ? patient.name.split(' ')[0] : 'there');

    // Also check if this patient has other active in-clinic protocols (different tokens)
    const { data: allProtocols } = await supabase
      .from('protocols')
      .select('id, program_type, medication, delivery_method, access_token, visit_frequency')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .eq('delivery_method', 'in_clinic')
      .in('program_type', ['hrt', 'weight_loss']);

    // Build booking options from all active in-clinic protocols
    const bookingOptions = [];
    const seenTypes = new Set();

    for (const p of (allProtocols || protocols)) {
      if (!PROTOCOL_BOOKING_MAP[p.program_type] || seenTypes.has(p.program_type)) continue;
      seenTypes.add(p.program_type);
      bookingOptions.push({
        ...PROTOCOL_BOOKING_MAP[p.program_type],
        protocolId: p.id,
        programType: p.program_type,
        visitFrequency: p.visit_frequency,
      });
    }

    return res.status(200).json({
      valid: true,
      patient: {
        firstName,
        name: patient?.name || '',
        email: patient?.email || '',
        phone: patient?.phone || '',
      },
      bookingOptions,
    });
  } catch (error) {
    console.error('Book validate error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
