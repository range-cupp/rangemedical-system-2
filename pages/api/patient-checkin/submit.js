// /pages/api/patient-checkin/submit.js
// Submit patient weight loss check-in
// Range Medical
// CREATED: 2026-01-04
// UPDATED: 2026-03-10 — Switched from GHL to direct SMS via Blooio/Twilio
//
// This endpoint receives patient self-reported data:
// - Weight
// - Side effects
// - Notes
// It logs to Supabase and sends SMS notifications directly

import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '../../../lib/send-sms';
import { buildSideEffectGuidance } from '../../../lib/wl-side-effect-guidance';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Staff phone numbers for check-in notifications
const STAFF_PHONES = [
  '+19496900339', // Chris
  '+19494244679', // Lily
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contact_id, weight, side_effects, notes } = req.body;

    if (!contact_id) {
      return res.status(400).json({ error: 'Contact ID required' });
    }

    if (!weight) {
      return res.status(400).json({ error: 'Weight required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const parsedWeight = parseFloat(weight);

    // Find patient — support both ghl_contact_id (legacy links) and patient id
    let patient;
    const { data: patientByGHL } = await supabase
      .from('patients')
      .select('id, name, first_name, phone, ghl_contact_id')
      .eq('ghl_contact_id', contact_id)
      .limit(1)
      .single();

    if (patientByGHL) {
      patient = patientByGHL;
    } else {
      const { data: patientById } = await supabase
        .from('patients')
        .select('id, name, first_name, phone, ghl_contact_id')
        .eq('id', contact_id)
        .limit(1)
        .single();
      patient = patientById;
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Find active weight loss protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or('program_type.eq.weight_loss,program_name.ilike.%weight loss%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'No active weight loss protocol found' });
    }

    // Build notes string with side effects
    let logNotes = 'Patient self-reported check-in';
    if (side_effects && side_effects.length > 0) {
      logNotes += ` | Side effects: ${side_effects.join(', ')}`;
    }
    if (notes && notes.trim()) {
      logNotes += ` | Notes: ${notes.trim()}`;
    }

    // For take-home patients, each check-in = 1 injection used
    const newSessionsUsed = (protocol.sessions_used || 0) + 1;
    const totalSessions = protocol.total_sessions || 4;
    const sessionsRemaining = totalSessions - newSessionsUsed;

    const { error: updateProtocolError } = await supabase
      .from('protocols')
      .update({
        sessions_used: newSessionsUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', protocol.id);

    if (updateProtocolError) {
      console.error('Error updating protocol sessions:', updateProtocolError);
    }

    // Create log entry in protocol_logs
    const { error: logError } = await supabase
      .from('protocol_logs')
      .insert({
        protocol_id: protocol.id,
        patient_id: patient.id,
        log_type: 'checkin',
        log_date: today,
        weight: parsedWeight,
        notes: logNotes
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating protocol log:', logError);
    }

    // Write to service_logs (single source of truth for all sessions)
    const { error: serviceLogError } = await supabase
      .from('service_logs')
      .insert({
        patient_id: patient.id,
        protocol_id: protocol.id,
        category: 'weight_loss',
        entry_type: 'injection',
        entry_date: today,
        medication: protocol.medication || 'Weight Loss',
        dosage: protocol.selected_dose || null,
        weight: parsedWeight,
        notes: logNotes,
        emr_entered: false
      });

    if (serviceLogError) {
      console.error('Error creating service log:', serviceLogError);
    }

    // Calculate weight change
    let weightChange = '';
    if (protocol.starting_weight) {
      const change = parsedWeight - protocol.starting_weight;
      weightChange = change < 0 ? `↓ ${Math.abs(change).toFixed(1)} lbs` : `↑ ${change.toFixed(1)} lbs`;
    }

    const isPaymentDue = newSessionsUsed > 0 && newSessionsUsed % 4 === 0;

    // ── Staff SMS notifications (direct via Blooio/Twilio) ──
    let smsMessage = `📱 WL Check-in: ${patient.name}\n\nWeight: ${parsedWeight} lbs`;
    if (weightChange) smsMessage += ` (${weightChange})`;
    smsMessage += `\nInjection: ${newSessionsUsed}/${totalSessions}`;

    if (side_effects && side_effects.length > 0) {
      smsMessage += `\n⚠️ Side effects: ${side_effects.join(', ')}`;
    }

    if (isPaymentDue) {
      smsMessage += `\n\n💰 PAYMENT DUE`;
    }

    for (const phone of STAFF_PHONES) {
      try {
        const result = await sendSMS({ to: phone, message: smsMessage });
        if (result.success) {
          console.log(`✓ Check-in SMS sent to ${phone} via ${result.provider}`);
        } else {
          console.error(`SMS to ${phone} failed:`, result.error);
        }
      } catch (smsError) {
        console.error(`SMS notification error (${phone}):`, smsError);
      }
    }

    // ── Patient thank-you SMS ──
    if (patient.phone) {
      try {
        const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');
        let thankYouMsg = `Thanks for checking in, ${firstName}! 🎉 Your weight has been logged.`;

        if (weightChange) {
          thankYouMsg += `\n\nYou're ${weightChange} from your starting weight — `;
          thankYouMsg += weightChange.startsWith('↓') ? 'keep up the great work!' : 'stay consistent, you\'ve got this!';
        }

        if (sessionsRemaining <= 0) {
          thankYouMsg += `\n\nYou've completed your current protocol! We'll be in touch about next steps.`;
        } else if (sessionsRemaining === 1) {
          thankYouMsg += `\n\nYou have 1 injection remaining in this cycle.`;
        }

        thankYouMsg += buildSideEffectGuidance(firstName, side_effects);
        thankYouMsg += `\n\n- Range Medical`;

        const result = await sendSMS({ to: patient.phone, message: thankYouMsg });
        if (result.success) {
          console.log(`✓ Thank-you SMS sent to patient via ${result.provider}`);
        } else {
          console.error('Thank-you SMS failed:', result.error);
        }
      } catch (thankYouError) {
        console.error('Thank-you SMS error:', thankYouError);
      }
    }

    console.log('✓ Patient check-in logged:', patient.name, parsedWeight, 'lbs', `(Injection ${newSessionsUsed}/${totalSessions})`);

    return res.status(200).json({
      success: true,
      message: 'Check-in recorded',
      weight: parsedWeight,
      weight_change: weightChange || null,
      injection_number: newSessionsUsed,
      injections_remaining: sessionsRemaining,
      payment_due: isPaymentDue
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
