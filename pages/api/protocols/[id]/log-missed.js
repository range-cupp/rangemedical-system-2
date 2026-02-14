// /pages/api/protocols/[id]/log-missed.js
// Log a missed week for weight loss protocols
// Creates a service_log entry with entry_type 'missed' and pushes next_expected_date forward

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map frequency strings to number of days
function frequencyToDays(frequency) {
  if (!frequency) return 7;
  const f = frequency.toLowerCase();
  if (f.includes('10 day')) return 10;
  if (f.includes('2 week') || f.includes('every 2')) return 14;
  if (f.includes('every other day')) return 2;
  return 7; // Default: weekly
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { missedDate, reason, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  if (!missedDate || !reason) {
    return res.status(400).json({ error: 'missedDate and reason are required' });
  }

  try {
    // 1. Fetch the protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // 2. Create service_log entry with entry_type 'missed'
    const logNotes = notes
      ? `Missed: ${reason} — ${notes}`
      : `Missed: ${reason}`;

    const { error: logError } = await supabase
      .from('service_logs')
      .insert([{
        patient_id: protocol.patient_id,
        category: 'weight_loss',
        entry_type: 'missed',
        entry_date: missedDate,
        medication: protocol.medication || null,
        dosage: protocol.selected_dose || protocol.dose || null,
        notes: logNotes
      }]);

    if (logError) {
      console.error('Error creating missed log:', logError);
      return res.status(500).json({ error: 'Failed to create missed log entry' });
    }

    // 3. Calculate and update next_expected_date
    const dayInterval = frequencyToDays(protocol.frequency);
    const nextDate = new Date(missedDate + 'T12:00:00');
    nextDate.setDate(nextDate.getDate() + dayInterval);
    const newNextExpected = nextDate.toISOString().split('T')[0];

    const { data: updatedProtocol, error: updateError } = await supabase
      .from('protocols')
      .update({
        next_expected_date: newNextExpected,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating protocol:', updateError);
      return res.status(500).json({ error: 'Missed log created but failed to update protocol' });
    }

    return res.status(200).json({
      success: true,
      protocol: updatedProtocol,
      next_expected_date: newNextExpected
    });
  } catch (err) {
    console.error('Error in log-missed:', err);
    return res.status(500).json({ error: err.message });
  }
}
