// /pages/api/protocols/[id]/redeem-range-iv.js
// Redeem the free monthly Range IV perk for an HRT protocol.
// Creates a service_log entry (category: 'iv') for the patient.
// Validates: protocol is active HRT, and no IV already used this billing cycle.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const { service_date } = req.body;

  const today = service_date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  try {
    // Get the HRT protocol
    const { data: protocol, error: pErr } = await supabase
      .from('protocols')
      .select('id, patient_id, program_type, last_payment_date, start_date, status, patient_name')
      .eq('id', id)
      .single();

    if (pErr || !protocol) return res.status(404).json({ error: 'Protocol not found' });
    if (protocol.status !== 'active') return res.status(400).json({ error: 'Protocol is not active' });

    // Validate it's an HRT protocol
    const pt = (protocol.program_type || '').toLowerCase();
    if (pt !== 'hrt') return res.status(400).json({ error: 'Not an HRT protocol' });

    // Determine billing cycle
    const cycleStart = protocol.last_payment_date || protocol.start_date;
    if (!cycleStart) return res.status(400).json({ error: 'No billing cycle start date' });

    const cycleStartDate = new Date(cycleStart + 'T00:00:00');
    const cycleEndDate = new Date(cycleStartDate);
    cycleEndDate.setDate(cycleEndDate.getDate() + 30);
    const cycleEndStr = cycleEndDate.toISOString().split('T')[0];

    // Check if already used this cycle (both 'iv' and 'iv_therapy' categories)
    const { data: existingIV } = await supabase
      .from('service_logs')
      .select('id')
      .eq('patient_id', protocol.patient_id)
      .in('category', ['iv', 'iv_therapy'])
      .gte('service_date', cycleStart)
      .lte('service_date', cycleEndStr)
      .limit(1);

    if (existingIV?.length > 0) {
      return res.status(400).json({ error: 'Range IV already used this billing cycle' });
    }

    // Create service log entry
    const { data: serviceLog, error: slErr } = await supabase
      .from('service_logs')
      .insert({
        patient_id: protocol.patient_id,
        category: 'iv',
        entry_type: 'session',
        service_date: today,
        entry_date: today,
        medication: 'Range IV',
        protocol_id: protocol.id,
        notes: 'HRT Membership Perk — complimentary monthly Range IV',
      })
      .select()
      .single();

    if (slErr) throw slErr;

    return res.json({
      success: true,
      service_log_id: serviceLog.id,
      message: 'Range IV redeemed successfully',
    });

  } catch (error) {
    console.error('Redeem Range IV error:', error);
    return res.status(500).json({ error: error.message });
  }
}
