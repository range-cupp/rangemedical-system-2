// /pages/api/admin/merge-duplicate-patients.js
// Find and merge duplicate patients with same email AND phone
// Range Medical - 2026-02-04
// GET = preview duplicates, POST = merge them

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Normalize phone for comparison (last 10 digits)
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// Normalize email for comparison (lowercase, trim)
function normalizeEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

export default async function handler(req, res) {
  const dryRun = req.method === 'GET';

  try {
    // Fetch all patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: true });

    if (patientsError) throw patientsError;

    // Group patients by normalized email OR phone
    const emailGroups = {};
    const phoneGroups = {};

    for (const patient of patients) {
      const normEmail = normalizeEmail(patient.email);
      const normPhone = normalizePhone(patient.phone);

      // Group by email
      if (normEmail) {
        if (!emailGroups[normEmail]) {
          emailGroups[normEmail] = [];
        }
        emailGroups[normEmail].push(patient);
      }

      // Group by phone
      if (normPhone) {
        if (!phoneGroups[normPhone]) {
          phoneGroups[normPhone] = [];
        }
        phoneGroups[normPhone].push(patient);
      }
    }

    // Combine: find patients that share EITHER email OR phone
    // Use a union-find approach to group connected patients
    const patientMap = new Map(patients.map(p => [p.id, p]));
    const parent = new Map();

    const find = (id) => {
      if (!parent.has(id)) parent.set(id, id);
      if (parent.get(id) !== id) {
        parent.set(id, find(parent.get(id)));
      }
      return parent.get(id);
    };

    const union = (id1, id2) => {
      const root1 = find(id1);
      const root2 = find(id2);
      if (root1 !== root2) {
        // Keep the older patient as the root
        const p1 = patientMap.get(root1);
        const p2 = patientMap.get(root2);
        if (new Date(p1.created_at) <= new Date(p2.created_at)) {
          parent.set(root2, root1);
        } else {
          parent.set(root1, root2);
        }
      }
    };

    // Union patients with same email
    for (const [email, patientsWithEmail] of Object.entries(emailGroups)) {
      if (patientsWithEmail.length > 1) {
        for (let i = 1; i < patientsWithEmail.length; i++) {
          union(patientsWithEmail[0].id, patientsWithEmail[i].id);
        }
      }
    }

    // Union patients with same phone
    for (const [phone, patientsWithPhone] of Object.entries(phoneGroups)) {
      if (patientsWithPhone.length > 1) {
        for (let i = 1; i < patientsWithPhone.length; i++) {
          union(patientsWithPhone[0].id, patientsWithPhone[i].id);
        }
      }
    }

    // Build final groups
    const groups = {};
    for (const patient of patients) {
      const root = find(patient.id);
      if (!groups[root]) {
        groups[root] = [];
      }
      groups[root].push(patient);
    }

    // Sort each group by created_at (oldest first)
    for (const group of Object.values(groups)) {
      group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    // Find groups with duplicates (more than 1 patient)
    const duplicateGroups = Object.entries(groups)
      .filter(([key, patientsInGroup]) => patientsInGroup.length > 1)
      .map(([key, patientsInGroup]) => {
        // Collect all unique emails and phones in the group
        const emails = [...new Set(patientsInGroup.map(p => p.email).filter(Boolean))];
        const phones = [...new Set(patientsInGroup.map(p => p.phone).filter(Boolean))];

        return {
          key,
          emails,
          phones,
          matchReason: emails.length > 1 || phones.length > 1
            ? 'same email or phone'
            : (emails.length === 1 ? 'same email' : 'same phone'),
          patients: patientsInGroup.map(p => ({
            id: p.id,
            name: p.name,
            first_name: p.first_name,
            last_name: p.last_name,
            email: p.email,
            phone: p.phone,
            ghl_contact_id: p.ghl_contact_id,
            created_at: p.created_at
          })),
          // The oldest record (first created) will be the primary
          primaryId: patientsInGroup[0].id,
          primaryName: patientsInGroup[0].name || `${patientsInGroup[0].first_name} ${patientsInGroup[0].last_name}`,
          duplicateIds: patientsInGroup.slice(1).map(p => p.id)
        };
      });

    if (dryRun) {
      // Preview mode - just show what would be merged
      return res.status(200).json({
        success: true,
        dryRun: true,
        totalPatients: patients.length,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.duplicateIds.length, 0),
        groups: duplicateGroups
      });
    }

    // Merge mode - actually perform the merges
    const results = {
      merged: [],
      errors: []
    };

    for (const group of duplicateGroups) {
      const primaryId = group.primaryId;
      const duplicateIds = group.duplicateIds;

      try {
        // Tables to update (move references from duplicate to primary)
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
          'weight_logs',
          'protocol_follow_up_labs',
          'appointment_logs',
          'hrt_memberships',
          'protocol_logs',
          'lab_journeys',
          'hrt_monthly_periods'
        ];

        // Update all related tables to point to primary patient
        for (const table of tablesToUpdate) {
          for (const dupId of duplicateIds) {
            const { error: updateError } = await supabase
              .from(table)
              .update({ patient_id: primaryId })
              .eq('patient_id', dupId);

            // Ignore errors for tables that might not exist or have no matching records
            if (updateError && !updateError.message.includes('does not exist')) {
              console.log(`Note: Could not update ${table} for ${dupId}:`, updateError.message);
            }
          }
        }

        // Merge any useful data from duplicates into primary
        // (e.g., if primary is missing ghl_contact_id but duplicate has it)
        const primaryPatient = group.patients[0];
        const updateFields = {};

        for (const dup of group.patients.slice(1)) {
          if (!primaryPatient.ghl_contact_id && dup.ghl_contact_id) {
            updateFields.ghl_contact_id = dup.ghl_contact_id;
          }
          if (!primaryPatient.first_name && dup.first_name) {
            updateFields.first_name = dup.first_name;
          }
          if (!primaryPatient.last_name && dup.last_name) {
            updateFields.last_name = dup.last_name;
          }
          if (!primaryPatient.date_of_birth && dup.date_of_birth) {
            updateFields.date_of_birth = dup.date_of_birth;
          }
          if (!primaryPatient.gender && dup.gender) {
            updateFields.gender = dup.gender;
          }
        }

        if (Object.keys(updateFields).length > 0) {
          await supabase
            .from('patients')
            .update(updateFields)
            .eq('id', primaryId);
        }

        // Delete the duplicate patient records
        for (const dupId of duplicateIds) {
          const { error: deleteError } = await supabase
            .from('patients')
            .delete()
            .eq('id', dupId);

          if (deleteError) {
            results.errors.push({
              group: group.key,
              duplicateId: dupId,
              error: deleteError.message
            });
          }
        }

        results.merged.push({
          email: group.email,
          phone: group.phone,
          primaryId,
          mergedIds: duplicateIds,
          fieldsUpdated: Object.keys(updateFields)
        });

      } catch (err) {
        results.errors.push({
          group: group.key,
          error: err.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      dryRun: false,
      merged: results.merged.length,
      errors: results.errors.length,
      details: results
    });

  } catch (error) {
    console.error('Merge duplicate patients error:', error);
    return res.status(500).json({ error: error.message });
  }
}
