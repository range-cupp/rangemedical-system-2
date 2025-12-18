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
      injection_days,
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

    // If patient_id not provided, look it up from patients table
    let resolvedPatientId = patient_id;
    if (!resolvedPatientId && ghl_contact_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', ghl_contact_id)
        .maybeSingle();
      
      if (patient) {
        resolvedPatientId = patient.id;
      }
    }

    // Generate access token
    const crypto = require('crypto');
    const accessToken = crypto.randomBytes(16).toString('hex');

    // Calculate expected injections based on frequency
    let expectedInjections = duration_days || 0;
    if (dose_frequency === '2x_daily') {
      expectedInjections = (duration_days || 0) * 2;
    } else if (dose_frequency === 'every_other_day') {
      expectedInjections = Math.ceil((duration_days || 0) / 2);
    } else if (dose_frequency === '2x_weekly') {
      expectedInjections = Math.ceil((duration_days || 0) / 7) * 2;
    } else if (dose_frequency === 'weekly') {
      expectedInjections = Math.ceil((duration_days || 0) / 7);
    }

    // Create protocol
    const protocolData = {
      patient_id: resolvedPatientId,
      ghl_contact_id,
      patient_name,
      patient_email,
      patient_phone,
      program_name: program_name || program_type,
      program_type,
      injection_location: injection_location || 'take_home',
      duration_days: duration_days || null,
      total_sessions: total_sessions || null,
      expected_injections: expectedInjections || null,
      primary_peptide: primary_peptide || null,
      secondary_peptide: secondary_peptide || null,
      dose_amount: dose_amount || null,
      dose_frequency: dose_frequency || 'daily',
      injection_days: injection_days || null,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || null,
      special_instructions: special_instructions || null,
      reminders_enabled: reminders_enabled !== false,
      status: status || 'active',
      amount: amount || null,
      access_token: accessToken,
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
    const { patient_id, ghl_contact_id, status, search, limit } = req.query;

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
    if (search) {
      query = query.or(`patient_name.ilike.%${search}%,patient_email.ilike.%${search}%,program_name.ilike.%${search}%`);
    }
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch protocols' });
    }

    return res.status(200).json({ protocols: data });
  }

  // PUT - Update protocol
  if (req.method === 'PUT') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Protocol ID required' });
    }

    const {
      patient_name,
      patient_email,
      patient_phone,
      ghl_contact_id,
      program_name,
      program_type,
      start_date,
      duration_days,
      status,
      primary_peptide,
      secondary_peptide,
      dose_amount,
      dose_frequency,
      injection_days,
      special_instructions,
      notes,
      reminders_enabled
    } = req.body;

    // Calculate end_date if start_date and duration_days provided
    let end_date = null;
    if (start_date && duration_days) {
      const endDateObj = new Date(start_date);
      endDateObj.setDate(endDateObj.getDate() + parseInt(duration_days));
      end_date = endDateObj.toISOString().split('T')[0];
    }

    // Calculate expected injections based on frequency
    let expectedInjections = null;
    if (duration_days && dose_frequency) {
      if (dose_frequency === '2x_daily') {
        expectedInjections = duration_days * 2;
      } else if (dose_frequency === 'daily') {
        expectedInjections = duration_days;
      } else if (dose_frequency === 'every_other_day') {
        expectedInjections = Math.ceil(duration_days / 2);
      } else if (dose_frequency === '2x_weekly') {
        expectedInjections = Math.ceil(duration_days / 7) * 2;
      } else if (dose_frequency === 'weekly') {
        expectedInjections = Math.ceil(duration_days / 7);
      }
    }

    const updateData = {
      patient_name,
      patient_email,
      patient_phone,
      ghl_contact_id,
      program_name,
      program_type,
      start_date,
      end_date,
      duration_days,
      expected_injections: expectedInjections,
      status,
      primary_peptide,
      secondary_peptide,
      dose_amount,
      dose_frequency,
      injection_days,
      special_instructions,
      notes,
      reminders_enabled,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const { data: protocol, error } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Protocol update error:', error);
      return res.status(500).json({ error: 'Failed to update protocol', details: error.message });
    }

    return res.status(200).json(protocol);
  }

  // DELETE - Delete protocol
  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Protocol ID required' });
    }

    // First unlink any purchases
    await supabase
      .from('purchases')
      .update({ protocol_id: null })
      .eq('protocol_id', id);

    // Delete injection logs
    await supabase
      .from('injection_logs')
      .delete()
      .eq('protocol_id', id);

    // Delete protocol
    const { error } = await supabase
      .from('protocols')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Protocol delete error:', error);
      return res.status(500).json({ error: 'Failed to delete protocol', details: error.message });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
