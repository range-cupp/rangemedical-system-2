// /pages/api/admin/protocols.js
// Protocol Management API - CRUD operations
// Range Medical

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';

// Verify admin auth
function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  return token === ADMIN_PASSWORD;
}

// Generate access token
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authorization
  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // =====================================================
    // GET - List protocols or get single protocol
    // =====================================================
    if (req.method === 'GET') {
      const { id, status, search, ghl_contact_id, limit = 100, offset = 0 } = req.query;

      // Single protocol lookup
      if (id) {
        const { data, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          return res.status(404).json({ error: 'Protocol not found' });
        }
        return res.status(200).json(data);
      }

      // List protocols with filters
      let query = supabase
        .from('protocols')
        .select('*', { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status);
        // Sort active protocols by end_date (ending soonest first)
        if (status === 'active') {
          query = query.order('end_date', { ascending: true, nullsFirst: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (ghl_contact_id) {
        query = query.eq('ghl_contact_id', ghl_contact_id);
      }

      if (search) {
        query = query.or(`patient_name.ilike.%${search}%,program_name.ilike.%${search}%,patient_email.ilike.%${search}%`);
      }

      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      const { data, error, count } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        protocols: data,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    }

    // =====================================================
    // POST - Create new protocol
    // =====================================================
    if (req.method === 'POST') {
      const {
        ghl_contact_id,
        patient_name,
        patient_email,
        patient_phone,
        program_type,
        program_name,
        start_date,
        duration_days,
        primary_peptide,
        secondary_peptide,
        dose_amount,
        dose_frequency,
        special_instructions,
        notes,
        reminders_enabled = true
      } = req.body;

      // Validate required fields
      if (!patient_name) {
        return res.status(400).json({ error: 'Patient name is required' });
      }
      if (!program_type) {
        return res.status(400).json({ error: 'Program type is required' });
      }
      if (!program_name) {
        return res.status(400).json({ error: 'Program name is required' });
      }

      // Calculate dates
      const startDateObj = start_date ? new Date(start_date) : new Date();
      const durationDays = duration_days || 10;
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(endDateObj.getDate() + durationDays);

      const protocolData = {
        ghl_contact_id: ghl_contact_id || null,
        patient_name,
        patient_email: patient_email || null,
        patient_phone: patient_phone || null,
        program_type: program_type || 'recovery_jumpstart_10day',
        program_name,
        start_date: startDateObj.toISOString().split('T')[0],
        end_date: endDateObj.toISOString().split('T')[0],
        duration_days: durationDays,
        status: 'active',
        access_token: generateToken(),
        primary_peptide: primary_peptide || null,
        secondary_peptide: secondary_peptide || null,
        dose_amount: dose_amount || null,
        dose_frequency: dose_frequency || null,
        special_instructions: special_instructions || null,
        notes: notes || null,
        reminders_enabled: reminders_enabled,
        injections_completed: 0
      };

      const { data, error } = await supabase
        .from('protocols')
        .insert(protocolData)
        .select()
        .single();

      if (error) {
        console.error('Protocol create error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({
        success: true,
        protocol: data,
        tracker_url: `https://app.range-medical.com/track/${data.access_token}`
      });
    }

    // =====================================================
    // PUT - Update protocol
    // =====================================================
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Protocol ID is required' });
      }

      const {
        patient_name,
        patient_email,
        patient_phone,
        program_type,
        program_name,
        start_date,
        end_date,
        duration_days,
        status,
        primary_peptide,
        secondary_peptide,
        dose_amount,
        dose_frequency,
        special_instructions,
        notes,
        reminders_enabled,
        injections_completed
      } = req.body;

      // Build update object with only provided fields
      const updateData = {};
      if (patient_name !== undefined) updateData.patient_name = patient_name;
      if (patient_email !== undefined) updateData.patient_email = patient_email;
      if (patient_phone !== undefined) updateData.patient_phone = patient_phone;
      if (program_type !== undefined) updateData.program_type = program_type;
      if (program_name !== undefined) updateData.program_name = program_name;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (duration_days !== undefined) updateData.duration_days = duration_days;
      if (status !== undefined) updateData.status = status;
      if (primary_peptide !== undefined) updateData.primary_peptide = primary_peptide;
      if (secondary_peptide !== undefined) updateData.secondary_peptide = secondary_peptide;
      if (dose_amount !== undefined) updateData.dose_amount = dose_amount;
      if (dose_frequency !== undefined) updateData.dose_frequency = dose_frequency;
      if (special_instructions !== undefined) updateData.special_instructions = special_instructions;
      if (notes !== undefined) updateData.notes = notes;
      if (reminders_enabled !== undefined) updateData.reminders_enabled = reminders_enabled;
      if (injections_completed !== undefined) updateData.injections_completed = injections_completed;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('protocols')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Protocol update error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        protocol: data
      });
    }

    // =====================================================
    // DELETE - Delete protocol
    // =====================================================
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Protocol ID is required' });
      }

      // First check if protocol exists
      const { data: existing, error: checkError } = await supabase
        .from('protocols')
        .select('id, patient_name, program_name')
        .eq('id', id)
        .single();

      if (checkError || !existing) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      // Delete related injection logs first
      await supabase
        .from('injection_logs')
        .delete()
        .eq('protocol_id', id);

      // Delete the protocol
      const { error: deleteError } = await supabase
        .from('protocols')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Protocol delete error:', deleteError);
        return res.status(500).json({ error: deleteError.message });
      }

      return res.status(200).json({
        success: true,
        message: `Protocol deleted: ${existing.program_name} for ${existing.patient_name}`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
