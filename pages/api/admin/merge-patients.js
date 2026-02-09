// /pages/api/admin/merge-patients.js
// Manual patient merge - select primary and duplicate to merge
// Range Medical - 2026-02-09

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    // Fetch both patients
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .in('id', [primaryId, duplicateId]);

    if (fetchError) throw fetchError;

    const primary = patients.find(p => p.id === primaryId);
    const duplicate = patients.find(p => p.id === duplicateId);

    if (!primary) {
      return res.status(404).json({ error: 'Primary patient not found' });
    }
    if (!duplicate) {
      return res.status(404).json({ error: 'Duplicate patient not found' });
    }

    // Tables that reference patient_id
    const tablesToUpdate = [
      'protocols',
      'purchases',
      'labs',
      'symptoms',
      'measurements',
      'alerts',
      'sessions',
      'intakes',
      'consents',
      'medical_documents',
      'clinic_appointments',
      'lab_orders',
      'symptom_responses',
      'lab_documents',
      'questionnaire_responses',
      'injection_logs',
      'service_logs',
      'weight_logs',
      'protocol_follow_up_labs',
      'appointment_logs',
      'hrt_memberships',
      'protocol_logs',
      'lab_journeys',
      'hrt_monthly_periods'
    ];

    // Count records that will be moved
    const recordCounts = {};
    for (const table of tablesToUpdate) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', duplicateId);

        if (!error && count > 0) {
          recordCounts[table] = count;
        }
      } catch (e) {
        // Table might not exist, skip it
      }
    }

    // If preview mode, return what would be merged
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
          created_at: primary.created_at
        },
        duplicate: {
          id: duplicate.id,
          name: duplicate.name || `${duplicate.first_name || ''} ${duplicate.last_name || ''}`.trim(),
          email: duplicate.email,
          phone: duplicate.phone,
          ghl_contact_id: duplicate.ghl_contact_id,
          created_at: duplicate.created_at
        },
        recordsToMove: recordCounts,
        totalRecords: Object.values(recordCounts).reduce((a, b) => a + b, 0)
      });
    }

    // Perform the merge
    const errors = [];

    // 1. Update all related tables to point to primary patient
    for (const table of tablesToUpdate) {
      try {
        const { error: updateError } = await supabase
          .from(table)
          .update({ patient_id: primaryId })
          .eq('patient_id', duplicateId);

        if (updateError && !updateError.message.includes('does not exist')) {
          errors.push({ table, error: updateError.message });
        }
      } catch (e) {
        // Ignore tables that don't exist
      }
    }

    // 2. Merge useful data from duplicate into primary (if primary is missing it)
    const updateFields = {};

    if (!primary.ghl_contact_id && duplicate.ghl_contact_id) {
      updateFields.ghl_contact_id = duplicate.ghl_contact_id;
    }
    if (!primary.first_name && duplicate.first_name) {
      updateFields.first_name = duplicate.first_name;
    }
    if (!primary.last_name && duplicate.last_name) {
      updateFields.last_name = duplicate.last_name;
    }
    if (!primary.email && duplicate.email) {
      updateFields.email = duplicate.email;
    }
    if (!primary.phone && duplicate.phone) {
      updateFields.phone = duplicate.phone;
    }
    if (!primary.date_of_birth && duplicate.date_of_birth) {
      updateFields.date_of_birth = duplicate.date_of_birth;
    }
    if (!primary.gender && duplicate.gender) {
      updateFields.gender = duplicate.gender;
    }
    if (!primary.address && duplicate.address) {
      updateFields.address = duplicate.address;
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

    // 3. Delete the duplicate patient record
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', duplicateId);

    if (deleteError) {
      errors.push({ table: 'patients (delete)', error: deleteError.message });
    }

    return res.status(200).json({
      success: true,
      merged: true,
      primaryId,
      deletedId: duplicateId,
      recordsMoved: recordCounts,
      fieldsUpdated: Object.keys(updateFields),
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Merge patients error:', error);
    return res.status(500).json({ error: error.message });
  }
}
