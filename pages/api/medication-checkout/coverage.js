// /pages/api/medication-checkout/coverage.js
// Returns coverage analysis for a patient + category combination
// Checks active subscriptions and protocols to determine if item is covered
//
// COVERAGE RULES:
// 1. Subscriptions (HRT membership, WL program) → cover items at $0
// 2. Session packs (HBOT 5-pack, RLT 10-pack, IV packs, injection packs) → cover remaining sessions
// 3. Peptides → NEVER covered. Always a new purchase. Protocols shown for linking only.
// 4. Supplements → NEVER covered.
// 5. Protocols past their end_date → do NOT count as coverage
// 6. Weight loss protocols → cover in-clinic injections if sessions remain

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';
import { getCycleConfig } from '../../../lib/protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map checkout categories to subscription service_category values
const CATEGORY_TO_SUB_CATEGORY = {
  testosterone: ['hrt'],
  weight_loss: ['weight_loss'],
  iv_therapy: ['iv_therapy', 'iv', 'combo_membership'],
  hbot: ['hbot', 'combo_membership'],
  red_light: ['red_light', 'rlt', 'combo_membership'],
  vitamin: ['weight_loss'], // B12/vitamin injections included in WL program only, not HRT
  // peptide: intentionally omitted — never covered by subscription
  // supplement: intentionally omitted — never covered
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

// Categories that are NEVER covered — always a new paid purchase
// Protocols exist for tracking/linking but don't grant zero-balance coverage
const NEVER_COVERED_CATEGORIES = ['peptide', 'supplement'];

// Categories where only session-based protocols with remaining sessions provide coverage
// (not subscriptions, which are handled separately)
const SESSION_COVERAGE_CATEGORIES = ['hbot', 'red_light', 'iv_therapy', 'vitamin'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, category } = req.query;

  if (!patient_id || !category) {
    return res.status(400).json({ error: 'Missing patient_id or category' });
  }

  const today = todayPacific();

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

    // Filter protocols: exclude those well past their end_date
    // For take-home meds (HRT, WL, peptide), allow a 30-day grace period
    // so a patient one day late on a refill can still check out against their protocol
    const TAKE_HOME_CATEGORIES = ['testosterone', 'weight_loss', 'peptide'];
    const graceDays = TAKE_HOME_CATEGORIES.includes(category) ? 30 : 0;
    const graceDate = (() => {
      const d = new Date(today + 'T12:00:00');
      d.setDate(d.getDate() - graceDays);
      return d.toISOString().split('T')[0];
    })();
    const validProtocols = (protocols || []).filter(p => {
      if (p.end_date && p.end_date < graceDate) return false;
      return true;
    });

    // Check subscription coverage (only for categories that CAN be covered)
    const subCategories = CATEGORY_TO_SUB_CATEGORY[category] || [];
    let matchingSub = null;
    if (!NEVER_COVERED_CATEGORIES.includes(category)) {
      // First try: match by service_category
      matchingSub = (subscriptions || []).find(s => s.service_category && subCategories.includes(s.service_category));

      // Fallback: if subscription has null service_category, infer from active protocols
      // e.g., patient has active HRT protocol + active subscription with no category → it's the HRT membership
      if (!matchingSub && (subscriptions || []).some(s => !s.service_category && s.status === 'active')) {
        const protoTypes = CATEGORY_TO_PROTOCOL_TYPE[category] || [];
        const hasMatchingProtocol = validProtocols.some(p => protoTypes.includes(p.program_type));
        if (hasMatchingProtocol) {
          matchingSub = (subscriptions || []).find(s => !s.service_category && s.status === 'active');
        }
      }
    }

    // Get matching protocols for this category
    const protoTypes = CATEGORY_TO_PROTOCOL_TYPE[category] || [];
    const matchingProtocols = validProtocols.filter(p => {
      if (!protoTypes.includes(p.program_type)) return false;
      // For peptides, include even if sessions are used up — we need to show cycle status
      if (category === 'peptide') return true;
      // For session-based protocols, check if sessions remain
      if (p.total_sessions && p.sessions_used >= p.total_sessions) return false;
      return true;
    });

    // Also check recently completed peptide protocols (within 90+14 days)
    // so we can enforce the 2-week off period after a completed cycle
    let allPeptideProtocols = [];
    if (category === 'peptide') {
      const { data: pepProtos } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', patient_id)
        .eq('program_type', 'peptide')
        .in('status', ['active', 'completed', 'expired'])
        .order('created_at', { ascending: false });
      allPeptideProtocols = pepProtos || [];
    }

    // Build coverage result
    let covered = false;
    let coverage_type = null;
    let coverage_source = null;
    let coverage_id = null;

    // Rule 1: Never-covered categories — skip coverage entirely
    if (NEVER_COVERED_CATEGORIES.includes(category)) {
      // No coverage — protocols shown for linking only
      covered = false;
    }
    // Rule 2: Subscription coverage (HRT membership, etc.)
    else if (matchingSub) {
      covered = true;
      coverage_type = 'subscription';
      // If subscription has no service_category, use the checkout category to label it
      coverage_source = matchingSub.service_category
        ? formatSubName(matchingSub)
        : formatSubNameFromCategory(category);
      coverage_id = matchingSub.id;
    }
    // Rule 3: Session pack coverage (HBOT/RLT/IV/injection packs with sessions remaining)
    else if (matchingProtocols.length > 0) {
      const proto = matchingProtocols[0];

      if (category === 'weight_loss') {
        // Weight loss: covered if protocol has sessions (injections) remaining
        if (proto.total_sessions && proto.sessions_used < proto.total_sessions) {
          covered = true;
          coverage_type = 'protocol';
          coverage_source = `${proto.program_name || 'Weight Loss Program'} (${proto.sessions_used || 0}/${proto.total_sessions} used)`;
          coverage_id = proto.id;
        }
      } else if (SESSION_COVERAGE_CATEGORIES.includes(category)) {
        // Session packs: covered only if sessions remain
        if (proto.total_sessions && proto.sessions_used < proto.total_sessions) {
          covered = true;
          coverage_type = 'protocol';
          coverage_source = `${proto.program_name || 'Session Pack'} (${proto.sessions_used || 0}/${proto.total_sessions} used)`;
          coverage_id = proto.id;
        }
      } else if (category === 'testosterone') {
        // HRT: if there's a matching protocol (even without session tracking),
        // it means they're on the program. But coverage comes from subscription, not protocol.
        // Protocol alone does NOT grant coverage — subscription must be active.
        covered = false;
      }
    }

    // Get matching protocols for the dropdown (for linking, even if not "covered")
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
      end_date: p.end_date,
      delivery_method: p.delivery_method,
      supply_type: p.supply_type,
      hrt_type: p.hrt_type,
    }));

    // Get all active protocols (for cross-category items like B12 in WL programs)
    const allActiveProtocols = validProtocols.map(p => ({
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

    // Fetch pricing from pos_services for non-covered items
    let suggested_services = [];
    if (!covered) {
      const posCategoryMap = {
        testosterone: 'hrt',
        weight_loss: 'weight_loss',
        peptide: 'peptide',
        iv_therapy: 'iv_therapy',
        hbot: 'hbot',
        red_light: 'red_light',
        vitamin: 'injections',
        supplement: 'supplements',
      };
      const posCategory = posCategoryMap[category];
      if (posCategory) {
        const { data: services } = await supabase
          .from('pos_services')
          .select('id, name, category, price, recurring, interval')
          .eq('active', true)
          .or(`category.eq.${posCategory},category.eq.${category}`)
          .order('sort_order', { ascending: true });

        suggested_services = (services || []).map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          price_cents: s.price,
          price_display: `$${(s.price / 100).toFixed(2)}`,
          recurring: s.recurring,
          interval: s.interval,
        }));
      }
    }

    // Fetch patient's saved cards for payment
    let saved_cards = [];
    if (!covered) {
      const { data: patientData } = await supabase
        .from('patients')
        .select('stripe_customer_id')
        .eq('id', patient_id)
        .single();

      if (patientData?.stripe_customer_id) {
        try {
          const stripe = (await import('../../../lib/stripe')).default;
          const paymentMethods = await stripe.paymentMethods.list({
            customer: patientData.stripe_customer_id,
            type: 'card',
          });
          saved_cards = (paymentMethods.data || []).map(pm => ({
            id: pm.id,
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
          }));
        } catch (err) {
          console.error('[coverage] Stripe cards error:', err.message);
        }
      }
    }

    // Peptide cycle tracking — compute days used across the active protocol
    // and determine if the patient is at/past the cycle max (90 days for recovery, etc.)
    let peptide_cycle = null;
    if (category === 'peptide' && allPeptideProtocols.length > 0) {
      // Find the most recent active protocol for this medication
      const activeProto = allPeptideProtocols.find(p => p.status === 'active');
      const recentCompleted = allPeptideProtocols.find(p => p.status === 'completed' || p.status === 'expired');
      const cycleProto = activeProto || recentCompleted;

      if (cycleProto) {
        const cycleConfig = getCycleConfig(cycleProto.medication);
        const maxDays = cycleConfig?.maxDays || 90;
        const offDays = cycleConfig?.offDays || 14;
        // total_sessions for peptides = total days in protocol
        const daysDispensed = cycleProto.total_sessions || 0;
        const daysRemaining = Math.max(0, maxDays - daysDispensed);

        // Check if cycle is maxed out and still in the off period
        let cycleBlocked = false;
        let offPeriodEnd = null;
        if (daysDispensed >= maxDays && cycleProto.end_date) {
          const endDate = new Date(cycleProto.end_date + 'T12:00:00');
          const offEnd = new Date(endDate);
          offEnd.setDate(offEnd.getDate() + offDays);
          offPeriodEnd = offEnd.toISOString().split('T')[0];
          if (today < offPeriodEnd) {
            cycleBlocked = true;
          }
        }

        peptide_cycle = {
          protocol_id: cycleProto.id,
          medication: cycleProto.medication,
          days_dispensed: daysDispensed,
          max_days: maxDays,
          days_remaining: daysRemaining,
          off_days: offDays,
          cycle_blocked: cycleBlocked,
          off_period_end: offPeriodEnd,
          cycle_label: cycleConfig?.label || 'Peptide Cycle',
          can_extend: daysDispensed < maxDays && cycleProto.status === 'active',
        };
      }
    }

    return res.status(200).json({
      covered,
      coverage_type,
      coverage_source,
      coverage_id,
      available_protocols: availableProtocols,
      all_protocols: allActiveProtocols,
      active_subscriptions: activeSubscriptions,
      suggested_services,
      saved_cards,
      peptide_cycle,
    });
  } catch (err) {
    console.error('[medication-checkout/coverage] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function formatSubNameFromCategory(checkoutCategory) {
  const labels = {
    testosterone: 'HRT Membership',
    weight_loss: 'Weight Loss Program',
    hbot: 'HBOT Membership',
    red_light: 'Red Light Membership',
    iv_therapy: 'IV Therapy Membership',
    vitamin: 'Membership',
  };
  return labels[checkoutCategory] || 'Active Membership';
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
