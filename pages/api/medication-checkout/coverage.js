// /pages/api/medication-checkout/coverage.js
// Returns coverage analysis for a patient + category combination
// Checks active subscriptions and protocols to determine if item is covered

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map checkout categories to subscription service_category values
const CATEGORY_TO_SUB_CATEGORY = {
  testosterone: ['hrt'],
  weight_loss: ['weight_loss'],
  peptide: ['peptide'],
  iv_therapy: ['iv_therapy', 'iv', 'combo_membership'],
  hbot: ['hbot', 'combo_membership'],
  red_light: ['red_light', 'rlt', 'combo_membership'],
  vitamin: ['hrt', 'weight_loss'], // B12 etc often included in programs
  supplement: [],
};

// Map checkout categories to protocol program_type values
const CATEGORY_TO_PROTOCOL_TYPE = {
  testosterone: ['hrt'],
  weight_loss: ['weight_loss'],
  peptide: ['peptide'],
  iv_therapy: ['iv', 'iv_therapy'],
  hbot: ['hbot'],
  red_light: ['rlt', 'red_light'],
  vitamin: ['vitamin', 'injection'],
  supplement: ['supplement'],
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, category } = req.query;

  if (!patient_id || !category) {
    return res.status(400).json({ error: 'Missing patient_id or category' });
  }

  try {
    // Fetch active subscriptions for this patient
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('patient_id', patient_id)
      .in('status', ['active', 'trialing']);

    // Fetch active protocols for this patient
    const { data: protocols } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Check subscription coverage
    const subCategories = CATEGORY_TO_SUB_CATEGORY[category] || [];
    const matchingSub = (subscriptions || []).find(s =>
      subCategories.includes(s.service_category)
    );

    // Check protocol coverage (has sessions remaining)
    const protoTypes = CATEGORY_TO_PROTOCOL_TYPE[category] || [];
    const matchingProtocols = (protocols || []).filter(p => {
      if (!protoTypes.includes(p.program_type)) return false;
      // For session-based protocols, check if sessions remain
      if (p.total_sessions && p.sessions_used >= p.total_sessions) return false;
      return true;
    });

    // Build coverage result
    let covered = false;
    let coverage_type = null;
    let coverage_source = null;
    let coverage_id = null;

    if (matchingSub) {
      covered = true;
      coverage_type = 'subscription';
      coverage_source = formatSubName(matchingSub);
      coverage_id = matchingSub.id;
    } else if (matchingProtocols.length > 0) {
      const proto = matchingProtocols[0];
      // Only mark as covered if it's a session-based protocol with sessions remaining
      if (proto.total_sessions && proto.sessions_used < proto.total_sessions) {
        covered = true;
        coverage_type = 'protocol';
        coverage_source = proto.program_name || proto.medication || 'Active Protocol';
        coverage_id = proto.id;
      }
    }

    // Get matching protocols for the dropdown (even if not "covered" — staff can link to them)
    const availableProtocols = matchingProtocols.map(p => ({
      id: p.id,
      program_name: p.program_name,
      program_type: p.program_type,
      medication: p.medication,
      selected_dose: p.selected_dose,
      frequency: p.frequency,
      total_sessions: p.total_sessions,
      sessions_used: p.sessions_used,
      start_date: p.start_date,
      delivery_method: p.delivery_method,
      supply_type: p.supply_type,
      hrt_type: p.hrt_type,
    }));

    // Get all active protocols (for cross-category items like B12 in WL programs)
    const allActiveProtocols = (protocols || []).map(p => ({
      id: p.id,
      program_name: p.program_name,
      program_type: p.program_type,
      medication: p.medication,
      total_sessions: p.total_sessions,
      sessions_used: p.sessions_used,
    }));

    // Get all active subscriptions
    const activeSubscriptions = (subscriptions || []).map(s => ({
      id: s.id,
      service_category: s.service_category,
      status: s.status,
      current_period_end: s.current_period_end,
      plan_name: formatSubName(s),
    }));

    return res.status(200).json({
      covered,
      coverage_type,
      coverage_source,
      coverage_id,
      available_protocols: availableProtocols,
      all_protocols: allActiveProtocols,
      active_subscriptions: activeSubscriptions,
    });
  } catch (err) {
    console.error('[medication-checkout/coverage] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function formatSubName(sub) {
  const cat = sub.service_category || '';
  const labels = {
    hrt: 'HRT Membership',
    weight_loss: 'Weight Loss Program',
    hbot: 'HBOT Membership',
    red_light: 'Red Light Membership',
    rlt: 'Red Light Membership',
    combo_membership: 'HBOT + RLT Combo Membership',
    iv_therapy: 'IV Therapy Membership',
  };
  return labels[cat] || `${cat.replace(/_/g, ' ')} Subscription`;
}
