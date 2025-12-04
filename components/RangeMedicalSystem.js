import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { patients } = req.body;

    if (!patients || !Array.isArray(patients)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const results = {
      updated: [],
      created: [],
      errors: []
    };

    for (const patient of patients) {
      try {
        // Validate required field
        if (!patient.email) {
          results.errors.push({
            row: patient,
            error: 'Email is required'
          });
          continue;
        }

        // Check if patient exists by email
        const { data: existing, error: findError } = await supabase
          .from('patients')
          .select('id')
          .eq('email', patient.email.toLowerCase().trim())
          .single();

        // Prepare patient data
        const patientData = {
          email: patient.email.toLowerCase().trim(),
          name: patient.name || '',
          phone: patient.phone || null,
          date_of_birth: patient.date_of_birth || null,
          address: patient.address || null,
          city: patient.city || null,
          state: patient.state || null,
          zip_code: patient.zip_code || null
        };

        if (existing) {
          // UPDATE existing patient
          const { data, error } = await supabase
            .from('patients')
            .update(patientData)
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;

          results.updated.push({
            email: patient.email,
            id: existing.id,
            data
          });
        } else {
          // CREATE new patient
          const { data, error } = await supabase
            .from('patients')
            .insert([patientData])
            .select()
            .single();

          if (error) throw error;

          results.created.push({
            email: patient.email,
            id: data.id,
            data
          });
        }
      } catch (error) {
        console.error('Error processing patient:', patient.email, error);
        results.errors.push({
          row: patient,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        total: patients.length,
        updated: results.updated.length,
        created: results.created.length,
        errors: results.errors.length
      },
      results
    });

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
