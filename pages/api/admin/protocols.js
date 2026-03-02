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
    const body = req.body;
    // Accept both old and new field names, map to actual DB columns
    const patient_id = body.patient_id;
    const ghl_contact_id = body.ghl_contact_id;
    const patient_name = body.patient_name;
    const patient_email = body.patient_email;
    const patient_phone = body.patient_phone;
    const purchase_id = body.purchase_id;
    const program_name = body.program_name;
    const program_type = body.program_type;
    const total_sessions = body.total_sessions;
    const start_date = body.start_date;
    const end_date = body.end_date;
    const status = body.status;
    const notes = body.notes;
    // Map old names → actual DB columns
    const medication = body.medication || body.primary_peptide || null;
    const secondary_medication = body.secondary_medication || body.secondary_peptide || null;
    const selected_dose = body.selected_dose || body.dose_amount || null;
    const frequency = body.frequency || body.dose_frequency || 'daily';
    const delivery_method = body.delivery_method || body.injection_location || 'take_home';

    // Validate required fields - only patient_name and program_type are truly required
    if (!patient_name || !program_type) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'patient_name and program_type are required',
        received: { patient_name: !!patient_name, program_type: !!program_type }
      });
    }

    // Generate a placeholder ghl_contact_id if not provided (for old/manual entries)
    const effectiveGhlContactId = ghl_contact_id || `manual_${Date.now()}_${patient_name.replace(/\s+/g, '_').toLowerCase()}`;

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

    // Create protocol — use actual DB column names only
    const protocolData = {
      patient_id: resolvedPatientId,
      ghl_contact_id: effectiveGhlContactId,
      patient_name,
      patient_email,
      patient_phone,
      program_name: program_name || program_type,
      program_type,
      medication,
      secondary_medication,
      selected_dose,
      frequency,
      delivery_method,
      total_sessions: total_sessions || null,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || null,
      notes: notes || null,
      status: status || 'active',
      access_token: accessToken,
      sessions_used: 0,
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

    // Create protocol_sessions for the injection calendar
    const totalDays = duration_days || total_sessions || 10;
    const startDateObj = new Date(start_date || new Date());
    const sessions = [];

    for (let i = 1; i <= totalDays; i++) {
      const sessionDate = new Date(startDateObj);
      sessionDate.setDate(startDateObj.getDate() + i - 1);
      
      sessions.push({
        protocol_id: protocol.id,
        session_number: i,
        scheduled_date: sessionDate.toISOString().split('T')[0],
        status: 'scheduled'
      });
    }

    if (sessions.length > 0) {
      const { error: sessionsError } = await supabase
        .from('protocol_sessions')
        .insert(sessions);
      
      if (sessionsError) {
        console.log('Note: Could not create protocol_sessions (table may not exist):', sessionsError.message);
        // Don't fail - table might not exist yet
      }
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
    const { patient_id, ghl_contact_id, status, search, limit, sort, direction } = req.query;

    let query = supabase.from('protocols').select(`
      *,
      patients(id, name, first_name, last_name, email, phone)
    `, { count: 'exact' });

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }
    if (ghl_contact_id) {
      query = query.eq('ghl_contact_id', ghl_contact_id);
    }
    if (status) {
      // Handle comma-separated status values
      const statuses = status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0]);
      } else {
        query = query.in('status', statuses);
      }
    }
    if (search) {
      query = query.or(`patient_name.ilike.%${search}%,patient_email.ilike.%${search}%,program_name.ilike.%${search}%`);
    }
    
    // Always set explicit limit to override Supabase default of 1000
    const maxLimit = limit ? parseInt(limit) : 10000;
    query = query.limit(maxLimit);

    // Sorting
    const sortField = sort || 'created_at';
    const sortAscending = direction !== 'desc';
    
    query = query.order(sortField, { ascending: sortAscending, nullsFirst: false });

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch protocols', details: error.message });
    }

    // Merge patient name from the joined patients table (single source of truth)
    const protocols = (data || []).map(protocol => {
      const p = protocol.patients;
      const patientName = p
        ? (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name || protocol.patient_name)
        : protocol.patient_name;
      const patientEmail = p?.email || protocol.patient_email;
      const patientPhone = p?.phone || protocol.patient_phone;

      return {
        ...protocol,
        patient_name: patientName || 'Unknown',
        patient_email: patientEmail,
        patient_phone: patientPhone
      };
    });

    return res.status(200).json({ protocols, total: count });
  }

  // PUT - Update protocol
  if (req.method === 'PUT') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Protocol ID required' });
    }

    const b = req.body;

    // Map old field names → actual DB columns
    const updateData = {
      patient_name: b.patient_name,
      patient_email: b.patient_email,
      patient_phone: b.patient_phone,
      ghl_contact_id: b.ghl_contact_id,
      program_name: b.program_name,
      program_type: b.program_type,
      start_date: b.start_date,
      end_date: b.end_date,
      total_sessions: b.total_sessions,
      status: b.status,
      notes: b.notes,
      // Map to actual DB column names
      medication: b.medication || b.primary_peptide,
      secondary_medication: b.secondary_medication || b.secondary_peptide,
      selected_dose: b.selected_dose || b.dose_amount,
      frequency: b.frequency || b.dose_frequency,
      delivery_method: b.delivery_method || b.injection_location,
      updated_at: new Date().toISOString()
    };

    // Calculate end_date if start_date and duration provided
    if (b.start_date && (b.duration_days || b.total_sessions)) {
      const days = parseInt(b.duration_days || b.total_sessions);
      const endDateObj = new Date(b.start_date);
      endDateObj.setDate(endDateObj.getDate() + days);
      updateData.end_date = endDateObj.toISOString().split('T')[0];
    }

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

    // Delete protocol logs
    await supabase
      .from('protocol_logs')
      .delete()
      .eq('protocol_id', id);

    // Delete protocol sessions
    await supabase
      .from('protocol_sessions')
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
