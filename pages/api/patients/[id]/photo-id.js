// pages/api/patients/[id]/photo-id.js
// Persist a Photo ID URL on the patient's most recent intake (or create a stub
// intake if none exists). The actual file upload happens client-side directly
// to Supabase Storage to avoid Vercel's serverless body-size limit.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: patientId } = req.query;
  const { photoIdUrl } = req.body || {};

  if (!patientId || !photoIdUrl) {
    return res.status(400).json({ error: 'patientId and photoIdUrl are required' });
  }

  try {
    const { data: existingIntake } = await supabase
      .from('intakes')
      .select('id')
      .eq('patient_id', patientId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingIntake?.id) {
      const { error: updateError } = await supabase
        .from('intakes')
        .update({ photo_id_url: photoIdUrl })
        .eq('id', existingIntake.id);
      if (updateError) {
        console.error('Intake update error:', updateError);
        return res.status(500).json({ error: 'Failed to attach photo ID', details: updateError.message });
      }
    } else {
      const { data: patient } = await supabase
        .from('patients')
        .select('first_name, last_name')
        .eq('id', patientId)
        .maybeSingle();

      const { error: insertError } = await supabase
        .from('intakes')
        .insert({
          patient_id: patientId,
          first_name: patient?.first_name || '',
          last_name: patient?.last_name || '',
          photo_id_url: photoIdUrl,
          submitted_at: new Date().toISOString(),
        });
      if (insertError) {
        console.error('Intake insert error:', insertError);
        return res.status(500).json({ error: 'Failed to attach photo ID', details: insertError.message });
      }
    }

    return res.status(200).json({ success: true, photo_id_url: photoIdUrl });
  } catch (err) {
    console.error('Photo ID handler error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
