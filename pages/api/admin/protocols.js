// /pages/api/admin/protocols.js
// Protocol CRUD API - Range Medical
// POST now delegates creation to lib/create-protocol.js
import { createClient } from '@supabase/supabase-js';
import { isWeightLossType, calculatePeptideDurationDays, calculateProtocolDurationDays } from '../../../lib/protocol-config';
import { getHRTLabSchedule, isHRTProtocol } from '../../../lib/hrt-lab-schedule';
import { createProtocol } from '../../../lib/create-protocol';
import { todayPacific } from '../../../lib/date-utils';

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
    const secondary_medications = body.secondary_medications || body.secondary_medication || body.secondary_peptide || '[]';
    const selected_dose = body.selected_dose || body.dose_amount || null;
    const frequency = body.frequency || body.dose_frequency || 'daily';
    const delivery_method = body.delivery_method || body.injection_location || 'take_home';
    const hrt_type = body.hrt_type || null;

    // Validate required fields - only patient_name and program_type are truly required
    if (!patient_name || !program_type) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'patient_name and program_type are required',
        received: { patient_name: !!patient_name, program_type: !!program_type }
      });
    }

    // Resolve patient_id if not provided
    let resolvedPatientId = patient_id;
    if (!resolvedPatientId && ghl_contact_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', ghl_contact_id)
        .maybeSingle();
      if (patient) resolvedPatientId = patient.id;
    }

    const effectiveGhlContactId = ghl_contact_id || `manual_${Date.now()}_${patient_name.replace(/\s+/g, '_').toLowerCase()}`;

    // Create protocol via centralized function
    // createProtocol handles: validation, duplicate prevention, cycle tracking, access_token, defaults
    const result = await createProtocol({
      patient_id: resolvedPatientId,
      ghl_contact_id: effectiveGhlContactId,
      patient_name,
      patient_email,
      patient_phone,
      program_name: isHRTProtocol(program_type) ? 'HRT Protocol' : isWeightLossType(program_type) ? 'Weight Loss Protocol' : program_type === 'peptide' ? 'Peptide Protocol' : (program_name || program_type),
      program_type,
      medication,
      hrt_type,
      secondary_medications,
      selected_dose,
      frequency,
      delivery_method,
      total_sessions: total_sessions || null,
      start_date: start_date || todayPacific(),
      end_date: end_date || null,
      notes: notes || null,
      status: status || 'active',
      num_vials: body.num_vials ? parseInt(body.num_vials) : null,
      doses_per_vial: body.doses_per_vial ? parseInt(body.doses_per_vial) : null,
    }, {
      source: 'admin-protocols',
      purchaseId: purchase_id,
    });

    if (!result.success) {
      if (result.duplicate) {
        // Link purchase to existing protocol if applicable
        if (purchase_id && result.duplicate.protocol?.id) {
          await supabase.from('purchases').update({
            protocol_id: result.duplicate.protocol.id,
            protocol_created: true
          }).eq('id', purchase_id);
        }
        return res.status(409).json({
          error: 'Active protocol already exists',
          details: result.error,
          existing_protocol_id: result.duplicate.protocolId || result.duplicate.protocol?.id
        });
      }
      console.error('Protocol creation error:', result.error);
      return res.status(500).json({ error: 'Failed to create protocol', details: result.error });
    }

    const protocol = result.protocol;

    // Create protocol_sessions for the injection calendar
    const totalDays = body.duration_days || total_sessions || 10;
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
      }
    }

    // ===== AUTO-SCHEDULE HRT LABS =====
    // When an HRT protocol is created, automatically schedule follow-up lab draws:
    // 8 weeks after start, then every 12 weeks x 3 (at 20, 32, 44 weeks)
    if (isHRTProtocol(program_type) && resolvedPatientId) {
      try {
        const labSchedule = getHRTLabSchedule(protocol.start_date, 8);
        // Skip the "Initial Labs" (day 0) — only create the follow-up draws
        const followUpLabs = labSchedule.filter(draw => draw.label !== 'Initial Labs');

        const labEntries = followUpLabs.map(draw => ({
          patient_id: resolvedPatientId,
          program_name: `HRT ${draw.label}`,
          program_type: 'labs',
          medication: 'Essential',
          delivery_method: 'follow_up',
          status: 'draw_scheduled',
          start_date: draw.targetDate,
          notes: `Auto-scheduled from HRT Protocol (started ${protocol.start_date}). ${draw.weekLabel}.`,
        }));

        if (labEntries.length > 0) {
          const { error: labError } = await supabase
            .from('protocols')
            .insert(labEntries);

          if (labError) {
            console.error('Error auto-scheduling HRT labs:', labError.message);
          } else {
            console.log(`Auto-scheduled ${labEntries.length} lab draws for HRT protocol ${protocol.id}`);
          }
        }
      } catch (labErr) {
        console.error('HRT lab scheduling error:', labErr);
        // Non-fatal — don't fail the protocol creation
      }
    }

    return res.status(201).json(protocol);
  }

  // GET - List protocols (with optional filters)
  // Uses pagination to bypass Supabase's 1000-row hard cap
  if (req.method === 'GET') {
    const { patient_id, ghl_contact_id, status, search, sort, direction } = req.query;

    // Sorting
    const sortField = sort || 'created_at';
    const sortAscending = direction !== 'desc';

    // Helper to build a query with all filters applied
    const buildQuery = () => {
      let q = supabase.from('protocols').select(`
        *,
        patients(id, name, first_name, last_name, email, phone)
      `, { count: 'exact' });

      if (patient_id) q = q.eq('patient_id', patient_id);
      if (ghl_contact_id) q = q.eq('ghl_contact_id', ghl_contact_id);
      if (status) {
        const statuses = status.split(',').map(s => s.trim());
        if (statuses.length === 1) {
          q = q.eq('status', statuses[0]);
        } else {
          q = q.in('status', statuses);
        }
      }
      if (search) {
        q = q.or(`patient_name.ilike.%${search}%,patient_email.ilike.%${search}%,program_name.ilike.%${search}%`);
      }
      q = q.order(sortField, { ascending: sortAscending, nullsFirst: false });
      return q;
    };

    // Paginate through all results (Supabase caps at 1000 per query)
    const PAGE_SIZE = 1000;
    let allData = [];
    let from = 0;
    let hasMore = true;
    let totalCount = null;

    while (hasMore) {
      const { data: batch, error, count } = await buildQuery().range(from, from + PAGE_SIZE - 1);

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch protocols', details: error.message });
      }

      if (totalCount === null) totalCount = count;

      if (batch && batch.length > 0) {
        allData = allData.concat(batch);
        from += PAGE_SIZE;
        hasMore = batch.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    // Merge patient name from the joined patients table (single source of truth)
    const protocols = allData.map(protocol => {
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

    return res.status(200).json({ protocols, total: totalCount });
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
      // Real DB column names
      medication: b.medication,
      secondary_medications: b.secondary_medications || '[]',
      selected_dose: b.selected_dose,
      frequency: b.frequency,
      delivery_method: b.delivery_method,
      num_vials: b.num_vials !== undefined ? (b.num_vials ? parseInt(b.num_vials) : null) : undefined,
      doses_per_vial: b.doses_per_vial !== undefined ? (b.doses_per_vial ? parseInt(b.doses_per_vial) : null) : undefined,
      updated_at: new Date().toISOString()
    };

    // Calculate end_date if start_date + enough inputs to derive a duration.
    // Priority: explicit duration_days > vial math > sessions + frequency.
    // Never treat total_sessions as literal days — that was a long-standing bug
    // that produced end dates months in the future.
    if (b.start_date && (b.duration_days || b.total_sessions || (b.num_vials && b.doses_per_vial))) {
      let days = null;
      if (b.duration_days) {
        days = parseInt(b.duration_days);
      } else if (b.num_vials && b.doses_per_vial) {
        const totalDoses = parseInt(b.num_vials) * parseInt(b.doses_per_vial);
        days = calculateProtocolDurationDays(totalDoses, b.frequency);
      } else if (b.total_sessions && b.frequency) {
        days = calculateProtocolDurationDays(b.total_sessions, b.frequency);
      }
      if (days) {
        const endDateObj = new Date(b.start_date);
        endDateObj.setDate(endDateObj.getDate() + days);
        updateData.end_date = endDateObj.toISOString().split('T')[0];
      }
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
