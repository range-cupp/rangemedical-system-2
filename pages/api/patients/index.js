import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get all patients
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('name');

      if (patientsError) throw patientsError;

      // For each patient, get their protocols, labs, symptoms, measurements, and intakes
      const patientsWithData = await Promise.all(
        patients.map(async (patient) => {
          // Get protocols
          const { data: protocols } = await supabase
            .from('protocols')
            .select('*')
            .eq('patient_id', patient.id)
            .order('start_date', { ascending: false });

          // Get labs
          const { data: labs } = await supabase
            .from('labs')
            .select('*')
            .eq('patient_id', patient.id)
            .order('lab_date', { ascending: false });

          // Get symptoms
          const { data: symptoms } = await supabase
            .from('symptoms')
            .select('*')
            .eq('patient_id', patient.id)
            .order('symptom_date', { ascending: false });

          // Get measurements
          const { data: measurements } = await supabase
            .from('measurements')
            .select('*')
            .eq('patient_id', patient.id)
            .order('measurement_date', { ascending: false });

          // Get intake forms
          const { data: intakes } = await supabase
            .from('intakes')
            .select('*')
            .eq('patient_id', patient.id)
            .order('submitted_at', { ascending: false });

          return {
            ...patient,
            protocols: protocols || [],
            labs: labs || [],
            symptoms: symptoms || [],
            measurements: measurements || [],
            intakes: intakes || []
          };
        })
      );

      res.status(200).json(patientsWithData);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, email, phone, date_of_birth } = req.body;

      const { data, error } = await supabase
        .from('patients')
        .insert([{ name, email, phone, date_of_birth }])
        .select();

      if (error) throw error;

      res.status(201).json(data[0]);
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
