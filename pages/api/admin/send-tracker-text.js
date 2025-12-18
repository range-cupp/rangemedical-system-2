// /pages/api/admin/send-tracker-text.js
// Send tracker link via SMS through GoHighLevel
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL API settings
const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    protocol_id,
    patient_name,
    patient_phone,
    access_token,
    ghl_contact_id
  } = req.body;

  if (!patient_phone || !access_token) {
    return res.status(400).json({ error: 'Phone and access_token required' });
  }

  // Build tracker URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';
  const trackerUrl = `${baseUrl}/track/${access_token}`;

  // Build message
  const firstName = patient_name?.split(' ')[0] || 'there';
  const message = `Hi ${firstName}! 👋\n\nYour Range Medical injection tracker is ready. Track your progress and stay on schedule:\n\n${trackerUrl}\n\nQuestions? Reply to this text or call (949) 997-3988`;

  try {
    // Try GHL API first if we have contact ID
    if (ghl_contact_id && GHL_API_KEY) {
      const ghlResponse = await sendViaGHL(ghl_contact_id, message);
      if (ghlResponse.success) {
        // Log the send
        await logTextSent(protocol_id, patient_phone, message, 'ghl');
        return res.status(200).json({ success: true, method: 'ghl' });
      }
    }

    // Fallback: Log that we need manual send
    console.log('SMS to send manually:', { to: patient_phone, message });
    
    // Log the attempt
    await logTextSent(protocol_id, patient_phone, message, 'manual');
    
    return res.status(200).json({ 
      success: true, 
      method: 'logged',
      message: 'Text logged for manual sending',
      sms_content: message,
      phone: patient_phone
    });

  } catch (error) {
    console.error('Send text error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function sendViaGHL(contactId, message) {
  try {
    // GHL Conversations API
    const response = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: contactId,
        message: message
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('GHL SMS sent:', data);
      return { success: true, data };
    } else {
      const error = await response.json();
      console.error('GHL SMS error:', error);
      return { success: false, error };
    }
  } catch (err) {
    console.error('GHL API error:', err);
    return { success: false, error: err.message };
  }
}

async function logTextSent(protocolId, phone, message, method) {
  try {
    // Update protocol with last text sent timestamp
    if (protocolId) {
      // First get current notes
      const { data: protocol } = await supabase
        .from('protocols')
        .select('notes')
        .eq('id', protocolId)
        .single();
      
      const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit' 
      });
      const newNote = `[${timestamp}] Tracker link texted to patient`;
      const updatedNotes = protocol?.notes 
        ? `${protocol.notes}\n${newNote}` 
        : newNote;
      
      await supabase
        .from('protocols')
        .update({ 
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', protocolId);
    }
  } catch (err) {
    console.error('Log error:', err);
  }
}
