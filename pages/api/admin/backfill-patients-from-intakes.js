// /pages/api/admin/backfill-patients-from-intakes.js
// Creates patient records from intakes that don't have linked patients
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
    intakesProcessed: 0,
    patientsCreated: 0,
    patientsLinked: 0,
    alreadyLinked: 0,
    errors: []
  };

  try {
    // Get all intakes
    const { data: intakes, error: intakesError } = await supabase
      .from('intakes')
      .select('*')
      .order('submitted_at', { ascending: true });

    if (intakesError) throw intakesError;

    console.log(`Processing ${intakes.length} intakes...`);

    // Get all existing patients for matching
    const { data: existingPatients } = await supabase
      .from('patients')
      .select('id, ghl_contact_id, email, phone, first_name, last_name');

    // Build lookup maps
    const patientByGhlId = {};
    const patientByEmail = {};
    const patientByPhone = {};
    const patientByName = {};

    existingPatients?.forEach(p => {
      if (p.ghl_contact_id) patientByGhlId[p.ghl_contact_id] = p;
      if (p.email) patientByEmail[p.email.toLowerCase().trim()] = p;
      if (p.phone) {
        const normalized = p.phone.replace(/\D/g, '').slice(-10);
        if (normalized.length === 10) patientByPhone[normalized] = p;
      }
      if (p.first_name && p.last_name) {
        const fullName = `${p.first_name.toLowerCase().trim()} ${p.last_name.toLowerCase().trim()}`;
        patientByName[fullName] = p;
      }
    });

    for (const intake of intakes) {
      results.intakesProcessed++;

      // Skip if already has patient_id and patient exists
      if (intake.patient_id) {
        const patientExists = existingPatients?.some(p => p.id === intake.patient_id);
        if (patientExists) {
          results.alreadyLinked++;
          continue;
        }
      }

      // Try to find matching patient
      let matchedPatient = null;

      // 1. By ghl_contact_id
      if (intake.ghl_contact_id && patientByGhlId[intake.ghl_contact_id]) {
        matchedPatient = patientByGhlId[intake.ghl_contact_id];
      }
      // 2. By email
      else if (intake.email && patientByEmail[intake.email.toLowerCase().trim()]) {
        matchedPatient = patientByEmail[intake.email.toLowerCase().trim()];
      }
      // 3. By phone
      else if (intake.phone) {
        const normalized = intake.phone.replace(/\D/g, '').slice(-10);
        if (normalized.length === 10 && patientByPhone[normalized]) {
          matchedPatient = patientByPhone[normalized];
        }
      }
      // 4. By name
      else if (intake.first_name && intake.last_name) {
        const fullName = `${intake.first_name.toLowerCase().trim()} ${intake.last_name.toLowerCase().trim()}`;
        if (patientByName[fullName]) {
          matchedPatient = patientByName[fullName];
        }
      }

      if (matchedPatient) {
        // Link intake to existing patient
        const { error: linkError } = await supabase
          .from('intakes')
          .update({ patient_id: matchedPatient.id })
          .eq('id', intake.id);

        if (!linkError) {
          results.patientsLinked++;
          console.log(`Linked intake ${intake.id} to existing patient ${matchedPatient.id}`);
        }
      } else {
        // Create new patient from intake
        const newPatient = {
          ghl_contact_id: intake.ghl_contact_id || null,
          first_name: intake.first_name,
          last_name: intake.last_name,
          name: `${intake.first_name || ''} ${intake.last_name || ''}`.trim() || null,
          email: intake.email,
          phone: intake.phone,
          date_of_birth: intake.date_of_birth,
          gender: intake.gender,
          address: intake.street_address,
          city: intake.city,
          state: intake.state,
          zip: intake.postal_code,
          source: 'intake_backfill',
          created_at: intake.submitted_at || new Date().toISOString()
        };

        const { data: createdPatient, error: createError } = await supabase
          .from('patients')
          .insert(newPatient)
          .select()
          .single();

        if (createError) {
          console.error(`Failed to create patient from intake ${intake.id}:`, createError.message);
          results.errors.push({
            intakeId: intake.id,
            name: `${intake.first_name} ${intake.last_name}`,
            error: createError.message
          });
        } else {
          // Link intake to new patient
          await supabase
            .from('intakes')
            .update({ patient_id: createdPatient.id })
            .eq('id', intake.id);

          results.patientsCreated++;
          console.log(`Created patient ${createdPatient.id} from intake ${intake.id}: ${intake.first_name} ${intake.last_name}`);

          // Add to lookup maps for future iterations
          if (createdPatient.ghl_contact_id) patientByGhlId[createdPatient.ghl_contact_id] = createdPatient;
          if (createdPatient.email) patientByEmail[createdPatient.email.toLowerCase().trim()] = createdPatient;
          if (createdPatient.phone) {
            const normalized = createdPatient.phone.replace(/\D/g, '').slice(-10);
            if (normalized.length === 10) patientByPhone[normalized] = createdPatient;
          }
        }
      }
    }

    // Also backfill from assessment_leads
    let leadsProcessed = 0;
    let leadsCreated = 0;
    let leadsLinked = 0;
    let leadsAlreadyLinked = 0;

    const { data: leads, error: leadsError } = await supabase
      .from('assessment_leads')
      .select('id, first_name, last_name, email, phone, patient_id, ghl_contact_id')
      .order('created_at', { ascending: true });

    if (!leadsError && leads) {
      // Refresh patient lookup maps (new patients may have been created above)
      const { data: refreshedPatients } = await supabase
        .from('patients')
        .select('id, ghl_contact_id, email, phone, first_name, last_name');

      const pByEmail = {};
      const pByPhone = {};
      refreshedPatients?.forEach(p => {
        if (p.email) pByEmail[p.email.toLowerCase().trim()] = p;
        if (p.phone) {
          const norm = p.phone.replace(/\D/g, '').slice(-10);
          if (norm.length === 10) pByPhone[norm] = p;
        }
      });

      for (const lead of leads) {
        leadsProcessed++;

        if (lead.patient_id) {
          leadsAlreadyLinked++;
          continue;
        }

        // Try to match by email
        let matched = null;
        if (lead.email) {
          matched = pByEmail[lead.email.toLowerCase().trim()] || null;
        }
        // Try by phone
        if (!matched && lead.phone) {
          const norm = lead.phone.replace(/\D/g, '').slice(-10);
          if (norm.length === 10) matched = pByPhone[norm];
        }

        if (matched) {
          await supabase.from('assessment_leads').update({ patient_id: matched.id }).eq('id', lead.id);
          leadsLinked++;
        } else if (lead.first_name && lead.email) {
          // Create patient from assessment lead
          const firstName = lead.first_name.trim();
          const lastName = (lead.last_name || '').trim();
          const capFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
          const capLast = lastName ? lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase() : '';

          const { data: newPatient, error: createErr } = await supabase
            .from('patients')
            .insert({
              first_name: capFirst,
              last_name: capLast || null,
              name: `${capFirst} ${capLast}`.trim(),
              email: lead.email.toLowerCase().trim(),
              phone: lead.phone || null,
              ghl_contact_id: lead.ghl_contact_id || null,
              source: 'assessment',
            })
            .select('id')
            .single();

          if (!createErr && newPatient) {
            await supabase.from('assessment_leads').update({ patient_id: newPatient.id }).eq('id', lead.id);
            leadsCreated++;
            // Add to lookup for future iterations
            if (lead.email) pByEmail[lead.email.toLowerCase().trim()] = newPatient;
          } else if (createErr) {
            results.errors.push({ leadId: lead.id, name: `${lead.first_name} ${lead.last_name}`, error: createErr.message });
          }
        }
      }
    }

    console.log('Backfill complete:', results);

    return res.status(200).json({
      success: true,
      results: {
        ...results,
        leadsProcessed,
        leadsCreated,
        leadsLinked,
        leadsAlreadyLinked,
      },
      message: `Intakes: ${results.intakesProcessed} processed, ${results.patientsCreated} created, ${results.patientsLinked} linked. Leads: ${leadsProcessed} processed, ${leadsCreated} created, ${leadsLinked} linked.`
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return res.status(500).json({ error: error.message });
  }
}
