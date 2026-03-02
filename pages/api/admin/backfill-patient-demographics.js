// /pages/api/admin/backfill-patient-demographics.js
// Populates patient profile demographics from assessment_leads and intakes
// Only fills in EMPTY fields — never overwrites existing data
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    patientsChecked: 0,
    updatedFromAssessment: 0,
    updatedFromIntake: 0,
    alreadyComplete: 0,
    fieldsUpdated: {},
    errors: []
  };

  try {
    // Get ALL patients (paginate to overcome 1000-row default limit)
    let patients = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: batch, error: pErr } = await supabase
        .from('patients')
        .select('id, email, phone, first_name, last_name, date_of_birth, gender, address, city, state, zip_code')
        .order('created_at', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (pErr) throw pErr;
      if (!batch || batch.length === 0) break;
      patients = patients.concat(batch);
      if (batch.length < pageSize) break;
      page++;
    }

    // Get all assessment leads with medical history
    const { data: leads } = await supabase
      .from('assessment_leads')
      .select('email, medical_history')
      .not('medical_history', 'is', null)
      .order('created_at', { ascending: false });

    // Build assessment lookup by email (most recent first)
    const assessmentByEmail = {};
    (leads || []).forEach(l => {
      if (l.email && l.medical_history) {
        const key = l.email.toLowerCase().trim();
        if (!assessmentByEmail[key]) assessmentByEmail[key] = l.medical_history;
      }
    });

    // Get all intakes
    const { data: intakes } = await supabase
      .from('intakes')
      .select('email, phone, date_of_birth, gender, street_address, city, state, postal_code')
      .order('submitted_at', { ascending: false });

    // Build intake lookup by email (most recent first)
    const intakeByEmail = {};
    (intakes || []).forEach(i => {
      if (i.email) {
        const key = i.email.toLowerCase().trim();
        if (!intakeByEmail[key]) intakeByEmail[key] = i;
      }
    });

    for (const patient of patients) {
      results.patientsChecked++;

      // Check which fields are missing
      const missing = [];
      if (!patient.date_of_birth) missing.push('date_of_birth');
      if (!patient.gender) missing.push('gender');
      if (!patient.address) missing.push('address');
      if (!patient.city) missing.push('city');
      if (!patient.state) missing.push('state');
      if (!patient.zip_code) missing.push('zip_code');

      if (missing.length === 0) {
        results.alreadyComplete++;
        continue;
      }

      const updates = {};
      let source = null;

      // Priority 1: Check assessment_leads medical_history
      const emailKey = patient.email?.toLowerCase().trim();
      if (emailKey) {
        const mh = assessmentByEmail[emailKey];
        if (mh?.personalInfo) {
          const pi = mh.personalInfo;
          if (!patient.date_of_birth && pi.dob) {
            // Convert date formats: "11/13/1993" → "1993-11-13"
            let parsedDob = pi.dob;
            if (typeof pi.dob === 'string' && pi.dob.includes('/')) {
              const parts = pi.dob.split('/');
              if (parts.length === 3) {
                const [m, d, y] = parts;
                parsedDob = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              }
            }
            updates.date_of_birth = parsedDob;
          }
          if (!patient.gender && pi.gender) {
            updates.gender = pi.gender;
          }
          if (!patient.address && pi.address?.street) {
            updates.address = pi.address.street;
          }
          if (!patient.city && pi.address?.city) {
            updates.city = pi.address.city;
          }
          if (!patient.state && pi.address?.state) {
            updates.state = pi.address.state;
          }
          if (!patient.zip_code && pi.address?.postalCode) {
            updates.zip_code = pi.address.postalCode;
          }
          if (Object.keys(updates).length > 0) source = 'assessment';
        }

        // Priority 2: Fill remaining from intakes
        const intake = intakeByEmail[emailKey];
        if (intake) {
          if (!patient.date_of_birth && !updates.date_of_birth && intake.date_of_birth) {
            updates.date_of_birth = intake.date_of_birth;
            source = source || 'intake';
          }
          if (!patient.gender && !updates.gender && intake.gender) {
            updates.gender = intake.gender;
            source = source || 'intake';
          }
          if (!patient.address && !updates.address && intake.street_address) {
            updates.address = intake.street_address;
            source = source || 'intake';
          }
          if (!patient.city && !updates.city && intake.city) {
            updates.city = intake.city;
            source = source || 'intake';
          }
          if (!patient.state && !updates.state && intake.state) {
            updates.state = intake.state;
            source = source || 'intake';
          }
          if (!patient.zip_code && !updates.zip_code && intake.postal_code) {
            updates.zip_code = intake.postal_code;
            source = source || 'intake';
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from('patients')
          .update(updates)
          .eq('id', patient.id);

        if (updateErr) {
          results.errors.push({
            patientId: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            error: updateErr.message
          });
        } else {
          if (source === 'assessment') results.updatedFromAssessment++;
          else results.updatedFromIntake++;

          // Track which fields were updated
          for (const field of Object.keys(updates)) {
            results.fieldsUpdated[field] = (results.fieldsUpdated[field] || 0) + 1;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      results,
      message: `${results.patientsChecked} patients checked. ${results.updatedFromAssessment} updated from assessments, ${results.updatedFromIntake} updated from intakes. ${results.alreadyComplete} already complete.`
    });

  } catch (error) {
    console.error('Backfill demographics error:', error);
    return res.status(500).json({ error: error.message });
  }
}
