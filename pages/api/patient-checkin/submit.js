// /pages/api/patient-checkin/submit.js
// Submit patient weight loss check-in
// Range Medical
// CREATED: 2026-01-04
//
// This endpoint receives patient self-reported data:
// - Weight
// - Side effects
// - Notes
// It logs to Supabase and syncs to GHL

import { createClient } from '@supabase/supabase-js';
import { updateGHLContact, addGHLNote, createGHLTask } from '../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // Find patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id')
      .eq('ghl_contact_id', contact_id)
      .single();

    if (patientError || !patient) {
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
    // Increment sessions_used on the protocol
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

    // Create log entry in protocol_logs (checkin type for take-home injection tracking)
    const logEntry = {
      protocol_id: protocol.id,
      patient_id: patient.id,
      log_type: 'checkin',
      log_date: today,
      weight: parsedWeight,
      notes: logNotes
    };

    const { data: insertedLog, error: logError } = await supabase
      .from('protocol_logs')
      .insert(logEntry)
      .select()
      .single();

    if (logError) {
      console.error('Error creating protocol log:', logError);
    }

    // Also write to service_logs (single source of truth for all sessions)
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
        notes: logNotes
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

    // Update GHL current weight and injection fields
    await updateGHLContact(contact_id, {
      'wl__current_weight': String(parsedWeight),
      'wl__injections_used': String(newSessionsUsed),
      'wl__injections_remaining': String(sessionsRemaining)
    });

    // Add note to GHL
    let ghlNote = `📱 PATIENT WEEKLY CHECK-IN

Date: ${today}
Weight: ${parsedWeight} lbs`;

    if (weightChange) {
      ghlNote += ` (${weightChange} from start)`;
    }
    
    ghlNote += `\nInjection: ${newSessionsUsed} of ${totalSessions}`;
    
    if (sessionsRemaining <= 0) {
      ghlNote += ` ✅ PROTOCOL COMPLETE`;
    } else if (sessionsRemaining === 1) {
      ghlNote += ` ⚠️ Last injection remaining`;
    }

    if (side_effects && side_effects.length > 0) {
      ghlNote += `\n\n⚠️ Side Effects Reported:\n• ${side_effects.join('\n• ')}`;
    } else {
      ghlNote += `\n\nNo side effects reported ✓`;
    }

    if (notes && notes.trim()) {
      ghlNote += `\n\nPatient Notes: "${notes.trim()}"`;
    }

    // Add payment reminder to note if this is 4th injection (or multiple of 4)
    const isPaymentDue = newSessionsUsed > 0 && newSessionsUsed % 4 === 0;
    
    if (isPaymentDue) {
      ghlNote += `\n\n💳 PAYMENT DUE - Patient has completed injection #${newSessionsUsed}. Time to renew for next cycle.`;
      
      // Create task for payment follow-up
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await createGHLTask(
        contact_id,
        `💳 WL Payment Due - ${patient.name}`,
        tomorrow.toISOString(),
        `Patient completed injection #${newSessionsUsed}. Follow up for next month's payment.`
      );
    }

    await addGHLNote(contact_id, ghlNote);

    // Send SMS notification to clinic when patient completes check-in
    const ghlApiKey = process.env.GHL_API_KEY;
    const notifyContactId = process.env.RESEARCH_NOTIFY_CONTACT_ID || 'a2IWAaLOI1kJGJGYMCU2';

    if (ghlApiKey) {
      let smsMessage = `📱 WL Check-in: ${patient.name}\n\nWeight: ${parsedWeight} lbs`;
      if (weightChange) smsMessage += ` (${weightChange})`;
      smsMessage += `\nInjection: ${newSessionsUsed}/${totalSessions}`;

      if (side_effects && side_effects.length > 0) {
        smsMessage += `\n⚠️ Side effects: ${side_effects.join(', ')}`;
      }

      if (isPaymentDue) {
        smsMessage += `\n\n💰 PAYMENT DUE`;
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
        console.log('✓ Check-in SMS notification sent');
      } catch (smsError) {
        console.error('SMS notification error:', smsError);
      }
    }

    // Send thank-you SMS to patient
    if (ghlApiKey && contact_id) {
      try {
        const firstName = patient.name ? patient.name.split(' ')[0] : 'there';
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
