import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });

  // Find protocol
  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, patient_id, medication, selected_dose, current_dose, start_date, frequency, injection_day, delivery_method, starting_weight, total_sessions, sessions_used, program_type, status')
    .eq('access_token', token)
    .eq('program_type', 'weight_loss')
    .single();

  if (!protocol) return res.status(404).json({ error: 'Not found' });

  // Get patient name
  const { data: patient } = await supabase
    .from('patients')
    .select('first_name, last_name')
    .eq('id', protocol.patient_id)
    .single();

  // Get injection logs (weight + dose history)
  const { data: logs } = await supabase
    .from('service_logs')
    .select('id, entry_date, entry_type, weight, dosage, notes')
    .eq('protocol_id', protocol.id)
    .eq('category', 'weight_loss')
    .in('entry_type', ['injection', 'checkin', 'weigh_in', 'weight_check'])
    .order('entry_date', { ascending: true });

  // Calculate stats
  const weightLogs = (logs || []).filter(l => l.weight);
  const startWeight = protocol.starting_weight ? parseFloat(protocol.starting_weight) : (weightLogs.length > 0 ? parseFloat(weightLogs[0].weight) : null);
  const currentWeight = weightLogs.length > 0 ? parseFloat(weightLogs[weightLogs.length - 1].weight) : null;
  const lowestWeight = weightLogs.length > 0 ? Math.min(...weightLogs.map(l => parseFloat(l.weight))) : null;

  // PATCH handler for updating injection day
  if (req.method === 'PATCH') {
    const { injection_day } = req.body;
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!injection_day || !validDays.includes(injection_day)) {
      return res.status(400).json({ error: 'Valid day required' });
    }
    const { error: updateError } = await supabase
      .from('protocols')
      .update({ injection_day })
      .eq('id', protocol.id);
    if (updateError) return res.status(500).json({ error: 'Failed to update' });
    return res.status(200).json({ success: true, injection_day });
  }

  // POST handler for check-in
  if (req.method === 'POST') {
    const { weight, side_effects, notes } = req.body;
    if (!weight) return res.status(400).json({ error: 'Weight required' });

    // Get today in Pacific time
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

    // Upsert: check if entry exists for today
    const { data: existing } = await supabase
      .from('service_logs')
      .select('id')
      .eq('protocol_id', protocol.id)
      .eq('entry_date', today)
      .in('entry_type', ['injection', 'checkin'])
      .limit(1);

    const noteStr = [
      'Patient self-reported check-in',
      side_effects && side_effects.length > 0 ? `Side effects: ${side_effects.join(', ')}` : 'Side effects: None',
      notes ? `Notes: ${notes}` : null
    ].filter(Boolean).join(' | ');

    if (existing && existing.length > 0) {
      await supabase
        .from('service_logs')
        .update({ weight: weight.toString(), notes: noteStr, dosage: protocol.current_dose || protocol.selected_dose })
        .eq('id', existing[0].id);
    } else {
      await supabase
        .from('service_logs')
        .insert({
          patient_id: protocol.patient_id,
          protocol_id: protocol.id,
          entry_date: today,
          entry_type: 'injection',
          category: 'weight_loss',
          medication: protocol.medication,
          dosage: protocol.current_dose || protocol.selected_dose,
          weight: weight.toString(),
          notes: noteStr,
        });

      // Update protocol sessions_used if total_sessions > 0
      if (protocol.total_sessions > 0) {
        await supabase
          .from('protocols')
          .update({ sessions_used: (protocol.sessions_used || 0) + 1 })
          .eq('id', protocol.id);
      }
    }

    return res.status(200).json({ success: true });
  }

  return res.status(200).json({
    patient: { firstName: patient?.first_name || 'there' },
    protocol: {
      medication: protocol.medication,
      dose: protocol.current_dose || protocol.selected_dose,
      startDate: protocol.start_date,
      frequency: protocol.frequency,
      injectionDay: protocol.injection_day,
      deliveryMethod: protocol.delivery_method,
      totalSessions: protocol.total_sessions,
      sessionsUsed: protocol.sessions_used,
      status: protocol.status,
    },
    logs: (logs || []).map(l => ({
      date: l.entry_date,
      weight: l.weight ? parseFloat(l.weight) : null,
      dose: l.dosage,
      notes: l.notes,
      sideEffects: l.notes ? (l.notes.match(/Side effects:\s*([^|]+)/) || [])[1]?.trim() : null,
    })),
    stats: {
      startWeight,
      currentWeight,
      lowestWeight,
      totalLoss: startWeight && currentWeight ? (startWeight - currentWeight).toFixed(1) : null,
      weekNumber: protocol.start_date ? Math.max(1, Math.ceil((new Date() - new Date(protocol.start_date)) / (7 * 24 * 60 * 60 * 1000))) : 1,
      injectionCount: (logs || []).filter(l => l.entry_type === 'injection').length,
    }
  });
}
