// /pages/api/patient/refill.js
// Refill Request API
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL API for sending notifications
const GHL_API_KEY = process.env.GHL_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });
  
  // Find protocol by access token
  const { data: protocol, error: protocolError } = await supabase
    .from('protocols')
    .select('id, ghl_contact_id, patient_name, patient_phone, program_name, primary_peptide')
    .eq('access_token', token)
    .single();
    
  if (protocolError || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  // GET - Check if there's a pending refill request
  if (req.method === 'GET') {
    try {
      const { data: pending, error } = await supabase
        .from('refill_requests')
        .select('*')
        .eq('protocol_id', protocol.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      
      return res.status(200).json({
        hasPendingRequest: !!pending,
        request: pending
      });
    } catch (error) {
      console.error('GET refill error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Create refill request
  if (req.method === 'POST') {
    try {
      const { notes, request_type = 'refill' } = req.body;
      
      // Check for existing pending request
      const { data: existing } = await supabase
        .from('refill_requests')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (existing) {
        return res.status(400).json({ 
          error: 'You already have a pending request. We\'ll be in touch soon!' 
        });
      }
      
      // Create refill request
      const { data: request, error } = await supabase
        .from('refill_requests')
        .insert({
          protocol_id: protocol.id,
          ghl_contact_id: protocol.ghl_contact_id,
          patient_name: protocol.patient_name,
          patient_phone: protocol.patient_phone,
          request_type: request_type,
          notes: notes || null,
          status: 'pending'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Send notification SMS to clinic (optional - internal alert)
      // You could also add this to a staff dashboard
      console.log(`📦 New ${request_type} request from ${protocol.patient_name} for ${protocol.program_name}`);
      
      // Add note to protocol
      await supabase
        .from('protocols')
        .update({
          notes: supabase.sql`COALESCE(notes, '') || ${`\n[${new Date().toLocaleString()}] Patient requested ${request_type}`}`
        })
        .eq('id', protocol.id);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Request submitted! We\'ll contact you within 24 hours.',
        request 
      });
    } catch (error) {
      console.error('POST refill error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
