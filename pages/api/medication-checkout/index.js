// /pages/api/medication-checkout/index.js
// Universal Medication Checkout API
// Orchestrates: service log creation, protocol update, receipt sending
// Handles both covered (membership/protocol) and paid checkouts

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateReceiptHtml } from '../../../lib/receipt-email';
import { todayPacific } from '../../../lib/date-utils';
import { isWeightLossType } from '../../../lib/protocol-config';
// Controlled substance staff config — used for logging, not blocking
// Dose approval is enforced via dose-change-requests SMS flow

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    patient_id,
    category,          // testosterone, weight_loss, peptide, iv_therapy, hbot, red_light, vitamin, supplement
    entry_type,        // injection, pickup, session, med_pickup
    medication,
    dosage,
    quantity,
    supply_type,       // prefilled_1week..8week, vial_5ml, vial_10ml, etc.
    duration,          // session duration in minutes (HBOT, RLT)
    weight,            // for weight loss weigh-ins
    notes,

    // Protocol linking
    protocol_id,       // link to specific protocol
    coverage_type,     // subscription, protocol, paid, comp
    coverage_source,   // display name: "HRT Membership", "Weight Loss Program", etc.

    // Dispensing details
    administered_by,
    lot_number,
    expiration_date,
    fulfillment_method, // in_clinic, overnight
    tracking_number,

    // Verification (testosterone + weight loss dual-sign-off)
    verified_by,

    // For paid checkouts (when coverage_type === 'paid')
    // Payment is handled by POSChargeModal — this just records the dispensing
    purchase_id,       // if created via POS payment flow

    // Weight loss multi-injection
    injection_method,
    injection_frequency,

    // Date override (for backdating)
    entry_date,

    // Email control
    send_receipt = true,   // default true; front desk can toggle off for multi-checkout visits
  } = req.body;

  if (!patient_id || !category) {
    return res.status(400).json({ error: 'Missing required fields: patient_id, category' });
  }

  // ── Controlled substance logging (testosterone) ──
  // Dose changes require Dr. Burgess approval via SMS (handled by dose-change-requests API).
  // Dispensing is logged with administered_by and verified_by when provided,
  // but does not block the checkout — the approval gate is on the dose change, not here.

  const logDate = entry_date || todayPacific();

  // Determine if this is an in-clinic purchase (not a take-home pickup)
  // For in-clinic: checkout only sets available injections on the protocol.
  // Actual injection tracking comes from encounter notes / service logs only.
  const resolvedEntryType = entry_type || (['hbot', 'iv_therapy', 'red_light'].includes(category) ? 'session' : 'injection');
  const isWLInClinic = isWeightLossType(category) && resolvedEntryType !== 'pickup' && resolvedEntryType !== 'med_pickup';
  const isPeptideInClinic = category === 'peptide' && fulfillment_method === 'in_clinic_injections';
  const isInClinicPurchase = isWLInClinic || isPeptideInClinic;

  try {
    // 1. Get patient info for receipt
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, email, phone')
      .eq('id', patient_id)
      .single();

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();

    let finalLog = null;

    // 2. For in-clinic purchases (WL or peptide): do NOT create a service log — encounter notes are the sole source
    // For everything else (take-home pickups, other categories): create service log as before
    if (!isInClinicPurchase) {
      const logData = {
        patient_id,
        category,
        entry_type: resolvedEntryType,
        entry_date: logDate,
        medication: medication || null,
        dosage: dosage || null,
        weight: weight ? parseFloat(weight) : null,
        quantity: quantity ? parseInt(quantity) : null,
        supply_type: supply_type || null,
        duration: duration ? parseInt(duration) : null,
        notes: notes || null,
        protocol_id: protocol_id || null,
        administered_by: administered_by || null,
        verified_by: verified_by || null,
        lot_number: lot_number || null,
        expiration_date: expiration_date || null,
        fulfillment_method: fulfillment_method || 'in_clinic',
        tracking_number: tracking_number || null,
        checkout_type: 'medication_checkout',
      };

      const { data: serviceLog, error: logError } = await supabase
        .from('service_logs')
        .insert([logData])
        .select()
        .single();

      finalLog = serviceLog;
      if (logError) {
        const msg = logError.message || '';
        if (msg.includes('checkout_type') || msg.includes('verified_by')) {
          delete logData.checkout_type;
          delete logData.verified_by;
          const { data: retryLog, error: retryError } = await supabase
            .from('service_logs')
            .insert([logData])
            .select()
            .single();
          if (retryError) throw retryError;
          finalLog = retryLog;
        } else {
          throw logError;
        }
      }
    }

    // 3. Update protocol if linked
    let protocolUpdate = { updated: false };

    if (protocol_id) {
      protocolUpdate = await updateProtocol(protocol_id, {
        category,
        entryType: resolvedEntryType,
        logDate,
        medication,
        dosage,
        quantity,
        supply_type,
        injection_method,
        injection_frequency,
        isInClinicPurchase,
      });
    }

    // 4. For weight loss TAKE-HOME pickups only, create future injection entries
    // In-clinic purchases (WL or peptide) do NOT pre-schedule — encounter notes handle each injection individually
    if (!isInClinicPurchase && isWeightLossType(category) && resolvedEntryType === 'pickup' && quantity && parseInt(quantity) > 0) {
      const pickupDosage = dosage || '';
      const atMatch = pickupDosage.match(/@\s*(.+)/);
      const injectionDose = atMatch ? atMatch[1].trim() : pickupDosage;

      for (let i = 0; i < parseInt(quantity); i++) {
        const injDate = new Date(logDate + 'T12:00:00');
        injDate.setDate(injDate.getDate() + i * 7);
        const injDateStr = injDate.toISOString().split('T')[0];
        await supabase.from('service_logs').insert([{
          patient_id,
          category,
          entry_type: 'injection',
          entry_date: injDateStr,
          medication: medication || null,
          dosage: injectionDose || null,
          quantity: 1,
          notes: `Dispensed on ${logDate} (${quantity}-injection pickup, week ${i + 1} of ${quantity})`,
          protocol_id: protocol_id || null,
          administered_by: administered_by || null,
          fulfillment_method: fulfillment_method || 'in_clinic',
        }]);
      }
    }

    // 4b. For HRT TAKE-HOME pickups, create future injection entries
    // Same logic as service-log: auto-create individual injection entries dated to the
    // patient's injection schedule (2x/week = Mon/Thu alternating 3/4 day gaps)
    const isHRTPickup = !isInClinicPurchase && category === 'testosterone' && resolvedEntryType === 'pickup' && quantity && parseInt(quantity) > 0;
    if (isHRTPickup) {
      const hrtPickupQty = parseInt(quantity);
      const pickupDosage = dosage || '';
      const atMatch = pickupDosage.match(/@\s*(.+)/);
      const injectionDose = atMatch ? atMatch[1].trim() : pickupDosage;

      // Get injection frequency from request, or look it up from the protocol
      let freq = injection_frequency ? parseInt(injection_frequency) : 0;
      if (!freq && protocol_id) {
        const { data: proto } = await supabase.from('protocols').select('injection_frequency').eq('id', protocol_id).single();
        freq = proto?.injection_frequency ? parseInt(proto.injection_frequency) : 2;
      }
      if (!freq) freq = 2; // default 2x/week
      let dayOffset = 0;
      let useShortGap = true;

      for (let i = 0; i < hrtPickupQty; i++) {
        if (freq >= 7) {
          dayOffset += 1;
        } else if (freq === 3) {
          const gaps = [2, 2, 3];
          dayOffset += gaps[i % 3];
        } else {
          dayOffset += useShortGap ? 3 : 4;
          useShortGap = !useShortGap;
        }

        const injDate = new Date(logDate + 'T12:00:00');
        injDate.setDate(injDate.getDate() + dayOffset);
        const injDateStr = injDate.toISOString().split('T')[0];

        await supabase.from('service_logs').insert([{
          patient_id,
          category,
          entry_type: 'injection',
          entry_date: injDateStr,
          medication: medication || null,
          dosage: injectionDose || null,
          quantity: 1,
          notes: `Take-home injection (dispensed ${logDate}, ${hrtPickupQty}-syringe pickup, ${i + 1} of ${hrtPickupQty})`,
          protocol_id: protocol_id || null,
          injection_method: injection_method || null,
          fulfillment_method: 'take_home',
        }]);
      }

      // Sync sessions_used from actual count
      if (protocol_id) {
        const { count: hrtCount } = await supabase
          .from('service_logs')
          .select('*', { count: 'exact', head: true })
          .eq('protocol_id', protocol_id)
          .in('entry_type', ['injection', 'session']);

        await supabase
          .from('protocols')
          .update({ sessions_used: hrtCount || 0, updated_at: new Date().toISOString() })
          .eq('id', protocol_id);

        // Update next_expected_date to after the last auto-created injection
        const lastInjOffset = dayOffset;
        const nextGapDays = freq >= 7 ? 1 : freq === 3 ? 2 : (hrtPickupQty % 2 === 1 ? 4 : 3);
        const nextAfterLast = new Date(logDate + 'T12:00:00');
        nextAfterLast.setDate(nextAfterLast.getDate() + lastInjOffset + nextGapDays);

        await supabase
          .from('protocols')
          .update({ next_expected_date: nextAfterLast.toISOString().split('T')[0] })
          .eq('id', protocol_id);
      }
    }

    // 5. Sync weight to vitals if provided
    if (weight) {
      await syncWeightToVitals(patient_id, weight, logDate, administered_by);
    }

    // 6. Send receipt/confirmation email (if enabled)
    const isCovered = coverage_type === 'subscription' || coverage_type === 'protocol' || coverage_type === 'comp';
    if (send_receipt) await sendCheckoutReceipt({
      patient,
      patientName,
      medication,
      category,
      quantity,
      supply_type,
      dosage,
      isCovered,
      coverageSource: coverage_source,
      logDate,
    });

    return res.status(200).json({
      success: true,
      service_log: finalLog,
      protocol_update: protocolUpdate,
      receipt_sent: send_receipt && !!patient.email,
    });
  } catch (err) {
    console.error('[medication-checkout] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Update protocol based on checkout
async function updateProtocol(protocolId, opts) {
  const { category, entryType, logDate, medication, dosage, quantity, supply_type, injection_method, injection_frequency, isInClinicPurchase } = opts;

  try {
    const { data: protocol, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', protocolId)
      .single();

    if (error || !protocol) {
      return { updated: false, error: 'Protocol not found' };
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    const protocolCategory = protocol.program_type || category;
    const categoryMatchesProtocol = category === protocolCategory || isWeightLossType(category) === isWeightLossType(protocolCategory);

    // ── IN-CLINIC PURCHASE (WL or Peptide) ──
    // Only sets available injections (total_sessions). Does NOT touch sessions_used.
    // Encounter notes / service logs are the sole source of injection tracking for in-clinic protocols.
    if (isInClinicPurchase) {
      const purchaseQty = quantity ? parseInt(quantity) : 1;
      const currentTotal = protocol.total_sessions || 0;
      const currentUsed = protocol.sessions_used || 0;

      // If patient has remaining sessions, this is a replenishment (e.g., new month)
      // If sessions_used >= total_sessions, extend total to give them more
      if (currentUsed >= currentTotal) {
        updates.total_sessions = currentTotal + purchaseQty;
      }
      // If they still have sessions remaining, don't change total_sessions
      // (they already have available injections from a prior purchase)

      // Update medication details if provided
      if (categoryMatchesProtocol || category === 'peptide') {
        if (medication) updates.medication = medication;
        if (dosage) updates.selected_dose = dosage;
      }
      if (injection_method) updates.injection_method = injection_method;
      if (injection_frequency) updates.injection_frequency = parseInt(injection_frequency);

      // Set delivery_method so appointment sync knows this is in-clinic
      updates.delivery_method = 'in_clinic';

      const { error: updateError } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', protocolId);

      if (updateError) throw updateError;
      return { updated: true, protocol_id: protocolId, updates, mode: 'in_clinic_purchase' };
    }

    // ── TAKE-HOME / SINGLE INJECTION PATH (existing behavior) ──
    updates.last_visit_date = logDate;

    // Increment sessions_used for session/injection-based protocols
    if ((entryType === 'injection' || entryType === 'session') && protocol.total_sessions && categoryMatchesProtocol) {
      const increment = 1;
      updates.sessions_used = (protocol.sessions_used || 0) + increment;

      // Calculate next expected date (7 days for single injection/session)
      const nextDate = new Date(logDate + 'T12:00:00');
      nextDate.setDate(nextDate.getDate() + 7);
      updates.next_expected_date = nextDate.toISOString().split('T')[0];

      // Check if protocol is now complete
      // Peptide protocols get a 14-day grace period after end_date before auto-completing
      if (updates.sessions_used >= protocol.total_sessions) {
        const isPeptide = protocolCategory === 'peptide';
        if (isPeptide) {
          const endDate = protocol.end_date ? new Date(protocol.end_date + 'T12:00:00') : null;
          const now = new Date(logDate + 'T12:00:00');
          const daysPastEnd = endDate ? Math.floor((now - endDate) / (1000 * 60 * 60 * 24)) : 0;
          if (daysPastEnd >= 14) {
            updates.status = 'completed';
            updates.end_date = logDate;
          }
        } else {
          updates.status = 'completed';
          updates.end_date = logDate;
        }
      }
    }

    // For pickups (HRT, peptide, WL take-home), update refill tracking
    if (entryType === 'pickup' || entryType === 'med_pickup') {
      updates.last_refill_date = logDate;

      // For WL take-home pickups: increment sessions_used
      // Only extend total_sessions if patient is at/past their limit (buying MORE sessions)
      // e.g., 6/8 + pickup 1 → 7/8 (still has sessions remaining, don't touch total)
      // e.g., 8/8 + pickup 4 → 12/12 (at limit, extend total to match)
      if (isWeightLossType(category) && quantity && parseInt(quantity) > 0) {
        const pickupQty = parseInt(quantity);
        const currentUsed = protocol.sessions_used || 0;
        const currentTotal = protocol.total_sessions || 0;
        const newUsed = currentUsed + pickupQty;
        updates.sessions_used = newUsed;

        // Only extend total_sessions if dispensing would exceed the current total
        if (newUsed > currentTotal) {
          updates.total_sessions = newUsed;
        }
      }

      // Calculate next expected date based on supply type
      if (supply_type) {
        const supplyDays = {
          prefilled_1week: 7,
          prefilled_2week: 14,
          prefilled_3week: 21,
          prefilled_4week: 28,
          prefilled_8week: 56,
          vial_5ml: 70,
          vial_10ml: 140,
          vial: 140,
        };

        // Handle prefilled_N (e.g. prefilled_3) — calculate next pickup date from injection schedule
        // For 2x/week (Mon/Thu), 3 injections cover days +3, +7, +10 — next needed at +14
        // Formula: walk the alternating gap pattern to find when the NEXT injection after the last dispensed one falls
        const prefillMatch = supply_type.match(/^prefilled_(\d+)$/);
        if (prefillMatch && !supplyDays[supply_type]) {
          const injCount = parseInt(prefillMatch[1]);
          const ipw = parseInt(protocol.injection_frequency) || 2;
          let dayOffset = 0;
          let useShortGap = true;
          for (let i = 0; i < injCount + 1; i++) { // +1 to get NEXT injection date
            if (ipw >= 7) { dayOffset += 1; }
            else if (ipw === 3) { dayOffset += [2, 2, 3][i % 3]; }
            else { dayOffset += useShortGap ? 3 : 4; useShortGap = !useShortGap; }
          }
          supplyDays[supply_type] = dayOffset;
        }

        if (supplyDays[supply_type]) {
          const nextDate = new Date(logDate + 'T12:00:00');
          nextDate.setDate(nextDate.getDate() + supplyDays[supply_type]);
          updates.next_expected_date = nextDate.toISOString().split('T')[0];
        }
      } else if (quantity) {
        // For peptide/WL pickups, use quantity as weeks
        let days = parseInt(quantity) * 7;

        // If there's an in-clinic injection on the same day as the pickup,
        // the take-home supply starts the following week (add 7 days)
        if (isWeightLossType(category)) {
          const { data: sameDayInjection } = await supabase
            .from('service_logs')
            .select('id')
            .eq('patient_id', protocol.patient_id)
            .eq('protocol_id', protocolId)
            .eq('entry_date', logDate)
            .eq('entry_type', 'injection')
            .limit(1);
          if (sameDayInjection && sameDayInjection.length > 0) {
            days += 7;
          }
        }

        const nextDate = new Date(logDate + 'T12:00:00');
        nextDate.setDate(nextDate.getDate() + (days || 30));
        updates.next_expected_date = nextDate.toISOString().split('T')[0];
      }

      // Update medication details only if the checkout item matches the protocol's category
      // AND it's the primary medication (prevents secondary meds like HCG from overwriting
      // the protocol's primary medication, e.g. Testosterone Cypionate)
      if (categoryMatchesProtocol) {
        let isSecondaryMed = false;
        try {
          const secMeds = protocol.secondary_medications
            ? (typeof protocol.secondary_medications === 'string' ? JSON.parse(protocol.secondary_medications) : protocol.secondary_medications)
            : [];
          isSecondaryMed = secMeds.includes(medication);
        } catch {}
        if (!isSecondaryMed) {
          if (medication) updates.medication = medication;
          if (dosage) updates.selected_dose = dosage;
        }
      }

      // Extend end_date if protocol is at or past its end_date (e.g., HRT refill a day late)
      if (protocol.end_date && protocol.end_date <= logDate && updates.next_expected_date) {
        updates.end_date = updates.next_expected_date;
      }
    }

    // Update injection method/frequency if provided
    if (injection_method) updates.injection_method = injection_method;
    if (injection_frequency) updates.injection_frequency = parseInt(injection_frequency);

    const { error: updateError } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', protocolId);

    if (updateError) throw updateError;

    return { updated: true, protocol_id: protocolId, updates };
  } catch (err) {
    console.error('[medication-checkout] Protocol update error:', err);
    return { updated: false, error: err.message };
  }
}

// Send checkout receipt email
async function sendCheckoutReceipt({ patient, patientName, medication, category, quantity, supply_type, dosage, isCovered, coverageSource, logDate }) {
  if (!patient.email) return;

  const firstName = (patientName || '').split(' ')[0] || 'there';

  // Build description
  const categoryLabels = {
    testosterone: 'HRT Medication',
    weight_loss: 'Weight Loss',
    peptide: 'Peptide',
    iv_therapy: 'IV Therapy',
    hbot: 'HBOT Session',
    red_light: 'Red Light Therapy',
    vitamin: 'Vitamin Injection',
    supplement: 'Supplement',
  };

  const catLabel = categoryLabels[category] || category;
  let description = medication ? `${catLabel} — ${medication}` : catLabel;
  if (dosage) description += ` (${dosage})`;
  if (supply_type) {
    const supplyLabels = {
      prefilled_1week: '1 Week Supply',
      prefilled_2week: '2 Week Supply',
      prefilled_3: '3 Injections',
      prefilled_3week: '3 Week Supply',
      prefilled_4week: '4 Week Supply',
      prefilled_8week: '8 Week Supply',
      vial_5ml: '5ml Vial',
      vial_10ml: '10ml Vial',
      vial: 'Vial',
    };
    // Handle dynamic prefilled_N values (e.g. prefilled_5 → "5 Injections")
    const prefillMatch = supply_type.match(/^prefilled_(\d+)$/);
    const label = supplyLabels[supply_type] || (prefillMatch ? `${prefillMatch[1]} Injections` : supply_type);
    description += ` — ${label}`;
  }

  try {
    if (isCovered) {
      // Send covered-by-membership receipt
      const html = generateCoveredReceiptHtml({
        firstName,
        patientName,
        description,
        coverageSource,
        date: logDate,
      });

      await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: patient.email,
        subject: `Checkout Confirmation — ${catLabel}`,
        html,
      });
    } else {
      // For paid items, the POS flow already sends a receipt
      // Only send a dispensing confirmation
      const html = generateCoveredReceiptHtml({
        firstName,
        patientName,
        description,
        coverageSource: 'Paid at checkout',
        date: logDate,
      });

      await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: patient.email,
        subject: `Checkout Confirmation — ${catLabel}`,
        html,
      });
    }
  } catch (err) {
    console.error('[medication-checkout] Receipt email error:', err.message);
  }
}

// Generate HTML for covered/zero-balance receipt
function generateCoveredReceiptHtml({ firstName, patientName, description, coverageSource, date }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e5e5e5;">
  <!-- Header -->
  <tr><td style="background:#000;padding:24px 32px;">
    <table width="100%"><tr>
      <td style="color:#fff;font-size:18px;font-weight:700;letter-spacing:1px;">RANGE MEDICAL</td>
      <td style="color:#999;font-size:12px;text-align:right;">Checkout Confirmation</td>
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px;">
    <p style="margin:0 0 20px;font-size:16px;color:#111;">Hi ${firstName},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#333;line-height:1.6;">
      Thank you for visiting Range Medical. Here's a summary of your checkout today.
    </p>

    <!-- Service Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;margin:0 0 24px;">
      <tr><td style="padding:16px;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin:0 0 6px;">Service</div>
        <div style="font-size:15px;font-weight:600;color:#111;">${description}</div>
      </td></tr>
      <tr><td style="padding:16px;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin:0 0 6px;">Date</div>
        <div style="font-size:14px;color:#111;">${new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' , timeZone: 'America/Los_Angeles' })}</div>
      </td></tr>
      <tr><td style="padding:16px;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin:0 0 6px;">Coverage</div>
        <div style="font-size:14px;color:#16a34a;font-weight:600;">${coverageSource}</div>
      </td></tr>
      <tr><td style="padding:16px;background:#f8fdf8;">
        <table width="100%"><tr>
          <td style="font-size:13px;color:#666;">Balance Due</td>
          <td style="font-size:20px;font-weight:700;color:#16a34a;text-align:right;">$0.00</td>
        </tr></table>
      </td></tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#666;">
      Questions? Call or text us at <strong>(949) 997-3988</strong>
    </p>
    <p style="margin:0;font-size:12px;color:#999;">
      range-medical.com &bull; 1901 Westcliff Drive, Suite 10, Newport Beach, CA
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Sync weight to patient_vitals
async function syncWeightToVitals(patient_id, weight, entry_date, recorded_by) {
  if (!patient_id || !weight) return;
  try {
    const dayStart = entry_date + 'T00:00:00Z';
    const dayEnd = entry_date + 'T23:59:59Z';
    const { data: existing } = await supabase
      .from('patient_vitals')
      .select('id')
      .eq('patient_id', patient_id)
      .gte('recorded_at', dayStart)
      .lte('recorded_at', dayEnd)
      .maybeSingle();

    if (existing) {
      await supabase.from('patient_vitals')
        .update({ weight_lbs: parseFloat(weight), recorded_by: recorded_by || 'Medication Checkout' })
        .eq('id', existing.id);
    } else {
      await supabase.from('patient_vitals').insert({
        patient_id,
        weight_lbs: parseFloat(weight),
        recorded_by: recorded_by || 'Medication Checkout',
        recorded_at: new Date(entry_date + 'T12:00:00Z').toISOString(),
      });
    }
  } catch (err) {
    console.error('[medication-checkout] syncWeightToVitals error:', err.message);
  }
}
