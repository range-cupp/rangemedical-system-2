// /pages/api/admin/protocols.js
// Protocol creation API - Range Medical
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // POST - Create new protocol
  if (req.method === 'POST') {
    const {
      patient_id,
      ghl_contact_id,
      patient_name,
      patient_email,
      patient_phone,
      purchase_id,
      program_name,
      program_type,
      injection_location,
      duration_days,
      total_sessions,
      primary_peptide,
      secondary_peptide,
      dose_amount,
      dose_frequency,
      start_date,
      end_date,
      special_instructions,
      reminders_enabled,
      status,
      amount
    } = req.body;

    // Validate required fields
    if (!ghl_contact_id || !patient_name || !program_type) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'ghl_contact_id, patient_name, and program_type are required' 
      });
    }

    // Create protocol
    const protocolData = {
      patient_id,
      ghl_contact_id,
      patient_name,
      patient_email,
      patient_phone,
      program_name: program_name || program_type,
      program_type,
      injection_location: injection_location || 'take_home',
      duration_days: duration_days || null,
      total_sessions: total_sessions || null,
      primary_peptide: primary_peptide || null,
      secondary_peptide: secondary_peptide || null,
      dose_amount: dose_amount || null,
      dose_frequency: dose_frequency || null,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || null,
      special_instructions: special_instructions || null,
      reminders_enabled: reminders_enabled !== false,
      status: status || 'active',
      amount: amount || null,
      injections_completed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .insert(protocolData)
      .select()
      .single();

    if (protocolError) {
      console.error('Protocol creation error:', protocolError);
      return res.status(500).json({ error: 'Failed to create protocol', details: protocolError.message });
    }

    // Link purchase to protocol if provided
    if (purchase_id) {
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({ protocol_id: protocol.id })
        .eq('id', purchase_id);

      if (purchaseError) {
        console.error('Failed to link purchase:', purchaseError);
        // Don't fail the whole request, protocol was created successfully
      }
    }

    return res.status(201).json(protocol);
  }

  // GET - List protocols (with optional filters)
  if (req.method === 'GET') {
    const { patient_id, ghl_contact_id, status } = req.query;

    let query = supabase.from('protocols').select('*');

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }
    if (ghl_contact_id) {
      query = query.eq('ghl_contact_id', ghl_contact_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch protocols' });
    }

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
