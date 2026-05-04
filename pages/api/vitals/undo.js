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
    const { vitals_id } = req.body;
    if (!vitals_id) {
      return res.status(400).json({ error: 'vitals_id is required' });
    }

    const { data: snapshot, error: snapErr } = await supabase
      .from('patient_vitals_history')
      .select('*')
      .eq('vitals_id', vitals_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapErr) throw snapErr;
    if (!snapshot) {
      return res.status(404).json({ error: 'No previous version found' });
    }

    const { data: restored, error: updateErr } = await supabase
      .from('patient_vitals')
      .update({
        height_inches: snapshot.height_inches,
        weight_lbs: snapshot.weight_lbs,
        bp_systolic: snapshot.bp_systolic,
        bp_diastolic: snapshot.bp_diastolic,
        bp_arm: snapshot.bp_arm,
        temperature: snapshot.temperature,
        pulse: snapshot.pulse,
        respiratory_rate: snapshot.respiratory_rate,
        o2_saturation: snapshot.o2_saturation,
        bmi: snapshot.bmi,
        recorded_by: snapshot.recorded_by,
        recorded_at: snapshot.recorded_at,
      })
      .eq('id', vitals_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    await supabase
      .from('patient_vitals_history')
      .delete()
      .eq('id', snapshot.id);

    return res.status(200).json({ success: true, vitals: restored });
  } catch (error) {
    console.error('Vitals undo error:', error);
    return res.status(500).json({ error: error.message });
  }
}
