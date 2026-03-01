// /pages/api/peptide-checkin/submit.js
// Submit patient peptide recovery check-in
// Range Medical
//
// Receives patient self-reported data:
// - feeling (1-5 scale)
// - adherence (yes/no - taking injections as scheduled)
// - side_effects (array)
// - notes
// Logs to Supabase and notifies clinic staff

import { createClient } from '@supabase/supabase-js';
import { addGHLNote } from '../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FEELING_LABELS = {
  1: 'Poor 😣',
  2: 'Fair 😕',
  3: 'OK 😐',
  4: 'Good 😊',
  5: 'Great 🤩'
};

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
    const { contact_id, feeling, adherence, side_effects, notes } = req.body;

    if (!contact_id) {
      return res.status(400).json({ error: 'Contact ID required' });
    }

    if (!feeling) {
      return res.status(400).json({ error: 'Feeling rating required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const feelingNum = parseInt(feeling);

    // Find patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id')
      .eq('ghl_contact_id', contact_id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Find active peptide protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or('program_type.eq.peptide,program_name.ilike.%peptide%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'No active peptide protocol found' });
    }

    // Build structured notes
    const feelingLabel = FEELING_LABELS[feelingNum] || `${feelingNum}/5`;
    let logNotes = `Peptide check-in | Feeling: ${feelingLabel} | Adherence: ${adherence === 'yes' ? 'Yes' : 'No'}`;

    if (side_effects && side_effects.length > 0) {
      logNotes += ` | Side effects: ${side_effects.join(', ')}`;
    }
    if (notes && notes.trim()) {
      logNotes += ` | Notes: ${notes.trim()}`;
    }

    // Create log entry in protocol_logs
    const logEntry = {
      protocol_id: protocol.id,
      patient_id: patient.id,
      log_type: 'peptide_checkin',
      log_date: today,
      notes: logNotes
    };

    const { error: logError } = await supabase
      .from('protocol_logs')
      .insert(logEntry);

    if (logError) {
      console.error('Error creating protocol log:', logError);
    }

    // Also write to service_logs
    const { error: serviceLogError } = await supabase
      .from('service_logs')
      .insert({
        patient_id: patient.id,
        protocol_id: protocol.id,
        category: 'peptide',
        entry_type: 'checkin',
        entry_date: today,
        medication: protocol.medication || protocol.primary_peptide || 'Recovery Peptide',
        dosage: protocol.selected_dose || protocol.dose_amount || null,
        notes: logNotes
      });

    if (serviceLogError) {
      console.error('Error creating service log:', serviceLogError);
    }

    // Add note to GHL
    const firstName = patient.name ? patient.name.split(' ')[0] : 'Patient';
    let ghlNote = `📱 PEPTIDE RECOVERY CHECK-IN

Date: ${today}
Feeling: ${feelingLabel}
Taking Injections as Scheduled: ${adherence === 'yes' ? 'Yes ✓' : 'No ⚠️'}`;

    if (side_effects && side_effects.length > 0 && !side_effects.includes('None')) {
      ghlNote += `\n\n⚠️ Side Effects Reported:\n• ${side_effects.join('\n• ')}`;
    } else {
      ghlNote += `\n\nNo side effects reported ✓`;
    }

    if (notes && notes.trim()) {
      ghlNote += `\n\nPatient Notes: "${notes.trim()}"`;
    }

    // Flag if patient isn't doing well or missed injections
    if (feelingNum <= 2) {
      ghlNote += `\n\n🔴 LOW FEELING SCORE - Follow up recommended`;
    }
    if (adherence !== 'yes') {
      ghlNote += `\n\n🔴 NOT ADHERING TO SCHEDULE - Follow up recommended`;
    }

    await addGHLNote(contact_id, ghlNote);

    // Send SMS notification to clinic staff
    const ghlApiKey = process.env.GHL_API_KEY;
    const notifyContactId = process.env.RESEARCH_NOTIFY_CONTACT_ID || 'a2IWAaLOI1kJGJGYMCU2';

    if (ghlApiKey) {
      let smsMessage = `📱 Peptide Check-in: ${patient.name}\n\nFeeling: ${feelingLabel}\nAdherence: ${adherence === 'yes' ? '✅ Yes' : '❌ No'}`;

      if (side_effects && side_effects.length > 0 && !side_effects.includes('None')) {
        smsMessage += `\n⚠️ Side effects: ${side_effects.join(', ')}`;
      }

      if (feelingNum <= 2 || adherence !== 'yes') {
        smsMessage += `\n\n🔴 NEEDS FOLLOW-UP`;
      }

      try {
        await fetch('https://services.leadconnectorhq.com/conversations/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Version': '2021-04-15',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'SMS',
            contactId: notifyContactId,
            message: smsMessage
          })
        });
        console.log('✓ Peptide check-in SMS notification sent to staff');
      } catch (smsError) {
        console.error('SMS notification error:', smsError);
      }
    }

    // Send thank-you SMS to patient
    if (ghlApiKey && contact_id) {
      try {
        let thankYouMsg = `Thanks for checking in, ${firstName}! 🎉 Your feedback has been recorded.`;

        if (feelingNum >= 4) {
          thankYouMsg += `\n\nGlad to hear you're doing well! Keep up the great work with your recovery.`;
        } else if (feelingNum === 3) {
          thankYouMsg += `\n\nThanks for the update. If anything changes, don't hesitate to reach out.`;
        } else {
          thankYouMsg += `\n\nWe see you're not feeling your best — someone from our team will follow up with you shortly.`;
        }

        if (adherence !== 'yes') {
          thankYouMsg += `\n\nConsistency is key for best results. If you're having trouble with your injection schedule, we can help.`;
        }

        thankYouMsg += `\n\n- Range Medical`;

        await fetch('https://services.leadconnectorhq.com/conversations/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Version': '2021-04-15',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'SMS',
            contactId: contact_id,
            message: thankYouMsg
          })
        });
        console.log('✓ Thank-you SMS sent to patient');
      } catch (thankYouError) {
        console.error('Thank-you SMS error:', thankYouError);
      }
    }

    console.log('✓ Peptide check-in logged:', patient.name, `Feeling: ${feelingNum}/5`, `Adherence: ${adherence}`);

    return res.status(200).json({
      success: true,
      message: 'Check-in recorded',
      feeling: feelingNum,
      adherence
    });

  } catch (error) {
    console.error('Peptide checkin API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
