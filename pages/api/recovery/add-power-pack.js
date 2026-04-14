// Recovery Power Pack Add-On API
// POST: { patient_id }
// Adds +8 sessions to the patient's active Recovery Membership

import { createClient } from '@supabase/supabase-js';
import { RECOVERY_OFFERS, OFFER_TYPES } from '../../../lib/recovery-offers';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { patient_id } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }

    // Find active membership
    const { data: membershipOffer } = await supabase
      .from('recovery_offers')
      .select('id')
      .eq('offer_type', 'MEMBERSHIP')
      .eq('active', true)
      .single();

    if (!membershipOffer) {
      return res.status(500).json({ error: 'Membership offer not found in database' });
    }

    const { data: enrollment, error: fetchError } = await supabase
      .from('recovery_enrollments')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('status', 'active')
      .eq('offer_id', membershipOffer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !enrollment) {
      return res.status(400).json({ error: 'No active Recovery Membership found for this patient' });
    }

    // Add 8 sessions
    const newAllowed = enrollment.sessions_allowed + 8;
    const { error: updateError } = await supabase
      .from('recovery_enrollments')
      .update({
        sessions_allowed: newAllowed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // Record purchase
    const powerPack = RECOVERY_OFFERS.ADD_ON;
    const { data: patient } = await supabase
      .from('patients')
      .select('name, email, phone')
      .eq('id', patient_id)
      .single();

    await supabase.from('purchases').insert({
      patient_id,
      patient_name: patient?.name || '',
      patient_email: patient?.email || '',
      patient_phone: patient?.phone || '',
      item_name: powerPack.name,
      category: 'recovery',
      amount: powerPack.priceCents / 100,
      amount_paid: powerPack.priceCents / 100,
      purchase_date: todayPacific(),
      payment_method: 'manual',
      source: 'recovery_power_pack',
    });

    return res.status(200).json({
      success: true,
      enrollment_id: enrollment.id,
      sessions_allowed: newAllowed,
      sessions_used: enrollment.sessions_used,
      sessions_remaining: newAllowed - enrollment.sessions_used,
    });

  } catch (error) {
    console.error('Recovery add-power-pack error:', error);
    return res.status(500).json({ error: error.message });
  }
}
