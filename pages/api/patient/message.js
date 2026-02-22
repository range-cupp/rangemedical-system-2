// /pages/api/patient/message.js
// Patient Message to Clinic API
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL API for creating conversations
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });
  
  // Find protocol by access token
  const { data: protocol, error: protocolError } = await supabase
    .from('protocols')
    .select('id, ghl_contact_id, patient_name, patient_phone, program_name')
    .eq('access_token', token)
    .single();
    
  if (protocolError || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  try {
    const { message, category = 'general' } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message required' });
    }
    
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }
    
    // Log the message in Supabase for tracking
    const { data: msgLog, error: logError } = await supabase
      .from('refill_requests') // Reusing this table for messages
      .insert({
        protocol_id: protocol.id,
        ghl_contact_id: protocol.ghl_contact_id,
        patient_name: protocol.patient_name,
        patient_phone: protocol.patient_phone,
        request_type: 'message',
        notes: `[${category}] ${message}`,
        status: 'pending'
      })
      .select()
      .single();
    
    if (logError) {
      console.error('Error logging message:', logError);
    }
    
    // Try to send via GHL if we have contact ID
    let ghlSent = false;
    
    if (protocol.ghl_contact_id && GHL_API_KEY) {
      try {
        // Add note to contact in GHL
        const noteResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${protocol.ghl_contact_id}/notes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            body: `📱 Message from Patient Tracker:\n\nCategory: ${category}\nMessage: ${message}\n\nProtocol: ${protocol.program_name}`
          })
        });
        
        if (noteResponse.ok) {
          ghlSent = true;
          console.log(`✅ Message from ${protocol.patient_name} logged to GHL`);
        }
      } catch (ghlError) {
        console.error('GHL note error:', ghlError);
      }
    }
    
    // Add note to protocol
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles',
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit'
    });
    
    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        notes: supabase.raw(`COALESCE(notes, '') || '\n[${timestamp}] Patient message (${category}): ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}'`)
      })
      .eq('id', protocol.id);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Message sent! We\'ll get back to you soon.',
      logged: true,
      ghl_synced: ghlSent
    });
    
  } catch (error) {
    console.error('Message error:', error);
    return res.status(500).json({ error: error.message });
  }
}
