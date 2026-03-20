// /pages/api/admin/protocols.js
// Protocol creation API - Range Medical
import { createClient } from '@supabase/supabase-js';
import { isRecoveryPeptide, isGHPeptide, RECOVERY_CYCLE_MAX_DAYS, RECOVERY_CYCLE_OFF_DAYS, GH_CYCLE_MAX_DAYS, GH_CYCLE_OFF_DAYS } from '../../../lib/protocol-config';
import { getHRTLabSchedule, isHRTProtocol } from '../../../lib/hrt-lab-schedule';
import { findDuplicateProtocol } from '../../../lib/duplicate-prevention';

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

    // ===== DUPLICATE PREVENTION =====
    // If creating from a purchase, check if that purchase already has a protocol linked
    // This prevents double-creation when auto-protocol (from POS) runs AND user manually creates
    if (purchase_id) {
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id, protocol_id, protocol_created')
        .eq('id', purchase_id)
        .single();

      if (existingPurchase?.protocol_id) {
        return res.status(409).json({
          error: 'Protocol already exists for this purchase',
          details: `Purchase already linked to protocol ${existingPurchase.protocol_id}. Use "View Protocol" instead.`,
          existing_protocol_id: existingPurchase.protocol_id
        });
      }
    }

    // Guard 2: Check for existing active protocol with same type + medication
    // Resolve patient_id first for the check
    let preCheckPatientId = patient_id;
    if (!preCheckPatientId && ghl_contact_id) {
      const { data: preCheckPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', ghl_contact_id)
        .maybeSingle();
      if (preCheckPatient) preCheckPatientId = preCheckPatient.id;
    }

    if (preCheckPatientId) {
      const existingProtocol = await findDuplicateProtocol(preCheckPatientId, program_type, medication);
      if (existingProtocol) {
        // Link purchase to existing protocol if applicable
        if (purchase_id) {
          await supabase.from('purchases').update({
            protocol_id: existingProtocol.id,
            protocol_created: true
          }).eq('id', purchase_id);
        }
        return res.status(409).json({
          error: 'Active protocol already exists',
          details: `Patient already has an active ${program_type} protocol (${existingProtocol.medication || existingProtocol.program_name}). Use the existing protocol instead.`,
          existing_protocol_id: existingProtocol.id
        });
      }
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

    // ===== 90-DAY CYCLE TRACKING =====
    // For recovery peptides (BPC-157, Thymosin Beta-4, etc.) and GH peptides,
    // track consecutive days across protocols with a shared cycle_start_date.
    // Max 90 days per cycle, then mandatory off period.
    let cycleStartDate = null;
    const isRecovery = isRecoveryPeptide(medication);
    const isGH = isGHPeptide(medication);

    if ((isRecovery || isGH) && resolvedPatientId) {
      const maxDays = isGH ? GH_CYCLE_MAX_DAYS : RECOVERY_CYCLE_MAX_DAYS;
      const offDays = isGH ? GH_CYCLE_OFF_DAYS : RECOVERY_CYCLE_OFF_DAYS;
      const filterFn = isGH ? isGHPeptide : isRecoveryPeptide;

      // Fetch existing peptide protocols for this patient
      const { data: existingProtocols } = await supabase
        .from('protocols')
        .select('id, medication, start_date, end_date, status, cycle_start_date')
        .eq('patient_id', resolvedPatientId)
        .not('status', 'in', '("cancelled","merged")')
        .order('start_date', { ascending: false });

      // Filter to matching peptide type
      const matchingProtocols = (existingProtocols || []).filter(p => filterFn(p.medication));

      if (matchingProtocols.length === 0) {
        // No prior cycle — start fresh
        cycleStartDate = start_date || new Date().toISOString().split('T')[0];
      } else {
        // Find protocols with cycle_start_date set, or infer from dates
        const withCycle = matchingProtocols.filter(p => p.cycle_start_date);

        if (withCycle.length > 0) {
          // Use the latest existing cycle
          const latestCycleDate = withCycle.sort((a, b) => b.cycle_start_date.localeCompare(a.cycle_start_date))[0].cycle_start_date;
          const cycleProtocols = withCycle.filter(p => p.cycle_start_date === latestCycleDate);

          // Calculate days used in this cycle
          let cycleDaysUsed = 0;
          for (const p of cycleProtocols) {
            const s = new Date(p.start_date + 'T12:00:00');
            const e = p.end_date ? new Date(p.end_date + 'T12:00:00') : new Date();
            cycleDaysUsed += Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
          }

          if (cycleDaysUsed >= maxDays) {
            // Cycle exhausted — check if off period has passed
            const latestEnd = cycleProtocols
              .filter(p => p.end_date)
              .map(p => new Date(p.end_date + 'T12:00:00'))
              .sort((a, b) => b - a)[0];

            const offEnd = latestEnd ? new Date(latestEnd) : new Date();
            offEnd.setDate(offEnd.getDate() + offDays);

            if (new Date() >= offEnd) {
              // Off period passed — start new cycle
              cycleStartDate = start_date || new Date().toISOString().split('T')[0];
            } else {
              // Still in off period — start new cycle anyway but warn (handled by client)
              cycleStartDate = start_date || new Date().toISOString().split('T')[0];
            }
          } else {
            // Cycle not exhausted — continue same cycle
            cycleStartDate = latestCycleDate;
          }
        } else {
          // No cycle_start_date on existing protocols — infer from earliest matching protocol
          const earliest = matchingProtocols.sort((a, b) => a.start_date.localeCompare(b.start_date))[0];

          // Calculate total days across all matching protocols
          let totalDaysUsed = 0;
          let latestEndDate = null;
          for (const p of matchingProtocols) {
            const s = new Date(p.start_date + 'T12:00:00');
            const e = p.end_date ? new Date(p.end_date + 'T12:00:00') : new Date();
            totalDaysUsed += Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
            if (!latestEndDate || e > latestEndDate) latestEndDate = e;
          }

          if (totalDaysUsed >= maxDays) {
            // Inferred cycle exhausted — start new cycle
            cycleStartDate = start_date || new Date().toISOString().split('T')[0];
          } else {
            // Continue inferred cycle — use earliest start_date as cycle start
            cycleStartDate = earliest.start_date;
            // Backfill cycle_start_date on existing matching protocols
            for (const p of matchingProtocols) {
              await supabase
                .from('protocols')
                .update({ cycle_start_date: earliest.start_date })
                .eq('id', p.id);
            }
          }
        }
      }
    }

    // Create protocol — use actual DB column names only
    const protocolData = {
      patient_id: resolvedPatientId,
      ghl_contact_id: effectiveGhlContactId,
      patient_name,
      patient_email,
      patient_phone,
      program_name: isHRTProtocol(program_type) ? 'HRT Protocol' : (program_name || program_type),
      program_type,
      medication,
      hrt_type: isHRTProtocol(program_type) ? (hrt_type || 'male') : null,
      secondary_medications: typeof secondary_medications === 'string' ? secondary_medications : JSON.stringify(secondary_medications),
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
      num_vials: body.num_vials ? parseInt(body.num_vials) : null,
      doses_per_vial: body.doses_per_vial ? parseInt(body.doses_per_vial) : null,
      cycle_start_date: cycleStartDate,
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
        // Don't fail - table might not exist yet
      }
    }

    // Link purchase to protocol if provided — set BOTH protocol_id AND protocol_created
    if (purchase_id) {
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({
          protocol_id: protocol.id,
          protocol_created: true
        })
        .eq('id', purchase_id);

      if (purchaseError) {
        console.error('Failed to link purchase:', purchaseError);
        // Don't fail the whole request, protocol was created successfully
      }
    }

    // ===== AUTO-SCHEDULE HRT LABS =====
    // When an HRT protocol is created, automatically schedule follow-up lab draws:
    // 8 weeks after start, then every 12 weeks x 3 (at 20, 32, 44 weeks)
    if (isHRTProtocol(program_type) && resolvedPatientId) {
      try {
        const labSchedule = getHRTLabSchedule(protocolData.start_date, 8);
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
          notes: `Auto-scheduled from HRT Protocol (started ${protocolData.start_date}). ${draw.weekLabel}.`,
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
      // Map to actual DB column names
      medication: b.medication || b.primary_peptide,
      secondary_medications: b.secondary_medications || '[]',
      selected_dose: b.selected_dose || b.dose_amount,
      frequency: b.frequency || b.dose_frequency,
      delivery_method: b.delivery_method || b.injection_location,
      num_vials: b.num_vials !== undefined ? (b.num_vials ? parseInt(b.num_vials) : null) : undefined,
      doses_per_vial: b.doses_per_vial !== undefined ? (b.doses_per_vial ? parseInt(b.doses_per_vial) : null) : undefined,
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
