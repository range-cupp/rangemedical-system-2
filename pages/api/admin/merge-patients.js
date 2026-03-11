// /pages/api/admin/merge-patients.js
// Comprehensive patient merge — reassigns ALL related records, updates denormalized fields,
// handles unique constraints, then deletes the duplicate patient.
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Group A: Simple patient_id reassignment (no denormalized fields)
const SIMPLE_FK_TABLES = [
  'protocols',
  'service_logs',
  'labs',
  'symptoms',
  'measurements',
  'alerts',
  'sessions',
  'medical_documents',
  'lab_orders',
  'symptom_responses',
  'protocol_logs',
  'injection_logs',
  'weight_logs',
  'weight_log',
  'protocol_follow_up_labs',
  'appointment_logs',
  'hrt_memberships',
  'hrt_monthly_periods',
  'lab_documents',
  'questionnaire_responses',
  'daily_logs',
  'check_ins',
  'calcom_bookings',
  'cellular_energy_checkins',
  'challenges',
  'patient_labs',
  'session_packages',
  'weight_loss_programs',
  'refill_requests',
  'journey_events',
  'notification_queue',
  'purchase_notifications',
  'checkin_reminders_log',
  'form_bundles',
  'session_usage',
  'pending_link_messages',
  '_archive_protocols',
  'lab_results',
  'prescriptions',
];

// Group B: Tables with denormalized patient fields that need updating
// Maps table name -> { column: value } to set (beyond patient_id)
function getDenormalizedTables(displayName, finalEmail, finalPhone, finalGhlContactId) {
  return {
    invoices: { patient_name: displayName, patient_email: finalEmail },
    purchases: { ghl_contact_id: finalGhlContactId },
    clinic_appointments: { patient_name: displayName, ghl_contact_id: finalGhlContactId },
    appointments: { patient_name: displayName, patient_phone: finalPhone },
    comms_log: { ghl_contact_id: finalGhlContactId },
    lab_journeys: {
      patient_name: displayName,
      patient_phone: finalPhone,
      patient_email: finalEmail,
      ghl_contact_id: finalGhlContactId,
    },
  };
}

// Group C: Tables with non-standard FK column names (not patient_id)
const CUSTOM_FK_TABLES = [
  { table: 'gift_card_redemptions', column: 'redeemed_by_patient_id' },
  { table: 'gift_cards', column: 'buyer_patient_id' },
];

// Helper: safely update a table, skip if it doesn't exist
async function safeUpdate(table, updateObj, filterCol, filterVal) {
  try {
    const { data, error, count } = await supabase
      .from(table)
      .update(updateObj, { count: 'exact' })
      .eq(filterCol, filterVal);
    if (error && !error.message.includes('does not exist')) {
      return { error: error.message };
    }
    return { count: count || 0 };
  } catch {
    return { count: 0 };
  }
}

// Helper: safely count records
async function safeCount(table, filterCol, filterVal) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(filterCol, filterVal);
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { primaryId, duplicateId, preview } = req.body;

  if (!primaryId || !duplicateId) {
    return res.status(400).json({ error: 'Both primaryId and duplicateId are required' });
  }

  if (primaryId === duplicateId) {
    return res.status(400).json({ error: 'Cannot merge a patient with themselves' });
  }

  try {
    // ===== Fetch both patients =====
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .in('id', [primaryId, duplicateId]);

    if (fetchError) throw fetchError;

    const primary = patients.find(p => p.id === primaryId);
    const duplicate = patients.find(p => p.id === duplicateId);

    if (!primary) return res.status(404).json({ error: 'Primary patient not found' });
    if (!duplicate) return res.status(404).json({ error: 'Duplicate patient not found' });

    // ===== Compute final merged values =====
    const finalFirstName = primary.first_name || duplicate.first_name || '';
    const finalLastName = primary.last_name || duplicate.last_name || '';
    const displayName = primary.name || (finalFirstName + ' ' + finalLastName).trim() || duplicate.name || 'Unknown';
    const finalEmail = primary.email || duplicate.email || null;
    const finalPhone = primary.phone || duplicate.phone || null;
    const finalGhlContactId = primary.ghl_contact_id || duplicate.ghl_contact_id || null;

    // ===== Build complete table list for counting =====
    const denormTables = getDenormalizedTables(displayName, finalEmail, finalPhone, finalGhlContactId);
    const allTables = [
      ...SIMPLE_FK_TABLES,
      ...Object.keys(denormTables),
      'patient_notes',
      'consent_forms',
      'intakes',
      'consents',
    ];
    // Deduplicate
    const uniqueTables = [...new Set(allTables)];

    // ===== Count records to move =====
    const recordCounts = {};
    for (const table of uniqueTables) {
      const count = await safeCount(table, 'patient_id', duplicateId);
      if (count > 0) recordCounts[table] = count;
    }
    // Count custom FK tables (non-standard column names)
    for (const { table, column } of CUSTOM_FK_TABLES) {
      const count = await safeCount(table, column, duplicateId);
      if (count > 0) recordCounts[table] = count;
    }

    // Also count fallback-linked records (ghl_contact_id/email with null patient_id)
    if (duplicate.ghl_contact_id) {
      for (const table of ['intakes', 'consents', 'consent_forms']) {
        try {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('ghl_contact_id', duplicate.ghl_contact_id)
            .is('patient_id', null);
          if (count > 0) recordCounts[table] = (recordCounts[table] || 0) + count;
        } catch { /* skip */ }
      }
    }
    if (duplicate.email) {
      for (const table of ['intakes', 'consents']) {
        try {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('email', duplicate.email)
            .is('patient_id', null);
          if (count > 0) recordCounts[table] = (recordCounts[table] || 0) + count;
        } catch { /* skip */ }
      }
    }

    const totalRecords = Object.values(recordCounts).reduce((a, b) => a + b, 0);

    // ===== Preview mode =====
    if (preview) {
      return res.status(200).json({
        success: true,
        preview: true,
        primary: {
          id: primary.id,
          name: primary.name || `${primary.first_name || ''} ${primary.last_name || ''}`.trim(),
          email: primary.email,
          phone: primary.phone,
          ghl_contact_id: primary.ghl_contact_id,
          created_at: primary.created_at,
        },
        duplicate: {
          id: duplicate.id,
          name: duplicate.name || `${duplicate.first_name || ''} ${duplicate.last_name || ''}`.trim(),
          email: duplicate.email,
          phone: duplicate.phone,
          ghl_contact_id: duplicate.ghl_contact_id,
          created_at: duplicate.created_at,
        },
        recordsToMove: recordCounts,
        totalRecords,
      });
    }

    // ===== Execute merge =====
    const errors = [];
    const moved = {};

    // --- Phase 1: Handle patient_notes (ghl_note_id collision check) ---
    try {
      // Find duplicate's notes with ghl_note_id
      const { data: dupNotes } = await supabase
        .from('patient_notes')
        .select('id, ghl_note_id')
        .eq('patient_id', duplicateId)
        .not('ghl_note_id', 'is', null);

      if (dupNotes && dupNotes.length > 0) {
        // Find primary's existing ghl_note_ids
        const { data: primaryNotes } = await supabase
          .from('patient_notes')
          .select('ghl_note_id')
          .eq('patient_id', primaryId)
          .not('ghl_note_id', 'is', null);

        const primaryNoteIds = new Set((primaryNotes || []).map(n => n.ghl_note_id));

        // Null out ghl_note_id on duplicate notes that would collide
        for (const note of dupNotes) {
          if (primaryNoteIds.has(note.ghl_note_id)) {
            await supabase
              .from('patient_notes')
              .update({ ghl_note_id: null })
              .eq('id', note.id);
          }
        }
      }

      // Now safely reassign all duplicate's notes
      const { count } = await supabase
        .from('patient_notes')
        .update({ patient_id: primaryId }, { count: 'exact' })
        .eq('patient_id', duplicateId);
      if (count > 0) moved.patient_notes = count;
    } catch (e) {
      errors.push({ table: 'patient_notes', error: e.message });
    }

    // --- Phase 2: Reassign Group A tables (simple patient_id) ---
    for (const table of SIMPLE_FK_TABLES) {
      const result = await safeUpdate(table, { patient_id: primaryId }, 'patient_id', duplicateId);
      if (result.error) {
        errors.push({ table, error: result.error });
      } else if (result.count > 0) {
        moved[table] = result.count;
      }
    }

    // --- Phase 2b: Reassign Group C tables (custom FK column names) ---
    for (const { table, column } of CUSTOM_FK_TABLES) {
      const result = await safeUpdate(table, { [column]: primaryId }, column, duplicateId);
      if (result.error) {
        errors.push({ table, error: result.error });
      } else if (result.count > 0) {
        moved[table] = result.count;
      }
    }

    // --- Phase 3: Reassign Group B tables (patient_id + denormalized fields) ---
    for (const [table, extraFields] of Object.entries(denormTables)) {
      // Filter out null values from extra fields
      const cleanFields = { patient_id: primaryId };
      for (const [k, v] of Object.entries(extraFields)) {
        if (v != null) cleanFields[k] = v;
      }

      const result = await safeUpdate(table, cleanFields, 'patient_id', duplicateId);
      if (result.error) {
        errors.push({ table, error: result.error });
      } else if (result.count > 0) {
        moved[table] = result.count;
      }
    }

    // --- Phase 4: Handle consent_forms (with ghl_contact_id) ---
    try {
      const cfUpdate = { patient_id: primaryId };
      if (finalGhlContactId) cfUpdate.ghl_contact_id = finalGhlContactId;

      const { count } = await supabase
        .from('consent_forms')
        .update(cfUpdate, { count: 'exact' })
        .eq('patient_id', duplicateId);
      if (count > 0) moved.consent_forms = (moved.consent_forms || 0) + count;
    } catch { /* skip */ }

    // --- Phase 5: Handle fallback-linked tables (intakes, consents) ---
    // Reassign by patient_id first
    for (const table of ['intakes', 'consents']) {
      try {
        const updateObj = { patient_id: primaryId };
        if (finalGhlContactId) updateObj.ghl_contact_id = finalGhlContactId;

        const { count } = await supabase
          .from(table)
          .update(updateObj, { count: 'exact' })
          .eq('patient_id', duplicateId);
        if (count > 0) moved[table] = (moved[table] || 0) + count;
      } catch { /* skip */ }

      // Also catch records linked by duplicate's ghl_contact_id with null patient_id
      if (duplicate.ghl_contact_id) {
        try {
          const { count } = await supabase
            .from(table)
            .update({ patient_id: primaryId }, { count: 'exact' })
            .eq('ghl_contact_id', duplicate.ghl_contact_id)
            .is('patient_id', null);
          if (count > 0) moved[table] = (moved[table] || 0) + count;
        } catch { /* skip */ }
      }

      // Also catch records linked by duplicate's email with null patient_id
      if (duplicate.email) {
        try {
          const { count } = await supabase
            .from(table)
            .update({ patient_id: primaryId }, { count: 'exact' })
            .eq('email', duplicate.email)
            .is('patient_id', null);
          if (count > 0) moved[table] = (moved[table] || 0) + count;
        } catch { /* skip */ }
      }
    }

    // Also catch consent_forms by ghl_contact_id
    if (duplicate.ghl_contact_id) {
      try {
        const { count } = await supabase
          .from('consent_forms')
          .update({ patient_id: primaryId, ghl_contact_id: finalGhlContactId }, { count: 'exact' })
          .eq('ghl_contact_id', duplicate.ghl_contact_id)
          .is('patient_id', null);
        if (count > 0) moved.consent_forms = (moved.consent_forms || 0) + count;
      } catch { /* skip */ }
    }

    // --- Phase 6: Merge missing fields into primary patient ---
    const updateFields = {};
    const fieldsToMerge = [
      'ghl_contact_id', 'first_name', 'last_name', 'name', 'phone',
      'date_of_birth', 'gender', 'address', 'stripe_customer_id',
    ];

    for (const field of fieldsToMerge) {
      if (!primary[field] && duplicate[field]) {
        updateFields[field] = duplicate[field];
      }
    }

    // Handle email separately due to UNIQUE constraint
    const takingDuplicateEmail = !primary.email && duplicate.email;
    if (takingDuplicateEmail) {
      // Clear duplicate's email first to avoid UNIQUE constraint violation
      await supabase.from('patients').update({ email: null }).eq('id', duplicateId);
      updateFields.email = duplicate.email;
    }

    if (Object.keys(updateFields).length > 0) {
      const { error: updatePrimaryError } = await supabase
        .from('patients')
        .update(updateFields)
        .eq('id', primaryId);

      if (updatePrimaryError) {
        errors.push({ table: 'patients (update)', error: updatePrimaryError.message });
      }
    }

    // --- Phase 7: Delete the duplicate patient ---
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', duplicateId);

    if (deleteError) {
      errors.push({ table: 'patients (delete)', error: deleteError.message });
    }

    console.log(`Patient merged: ${displayName} — ${Object.values(moved).reduce((a, b) => a + b, 0)} records transferred, duplicate ${duplicateId} deleted`);

    return res.status(200).json({
      success: true,
      merged: true,
      primaryId,
      deletedId: duplicateId,
      recordsMoved: moved,
      fieldsUpdated: Object.keys(updateFields),
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Merge patients error:', error);
    return res.status(500).json({ error: error.message });
  }
}
