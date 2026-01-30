// /pages/api/admin/fix-unknown-purchases.js
// Find Unknown purchases and try to link them to existing patients
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET = preview, POST = apply fixes
  const dryRun = req.method === 'GET';

  try {
    // Find purchases with "Unknown" patient name
    const { data: unknownPurchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .ilike('patient_name', '%unknown%')
      .order('purchase_date', { ascending: false });

    if (purchasesError) throw purchasesError;

    // Get all patients for matching
    const { data: allPatients } = await supabase
      .from('patients')
      .select('id, name, email, phone, ghl_contact_id');

    const patients = allPatients || [];
    const purchases = unknownPurchases || [];

    const results = {
      total_unknown: purchases.length,
      matched: [],
      unmatched: [],
      updated: []
    };

    for (const p of purchases) {
      let matchedPatient = null;
      let matchMethod = null;

      // Try to match by ghl_contact_id
      if (p.ghl_contact_id) {
        matchedPatient = patients.find(pt => pt.ghl_contact_id === p.ghl_contact_id);
        if (matchedPatient) matchMethod = 'ghl_contact_id';
      }

      // Try to parse raw_payload for additional contact info
      let payloadEmail = null;
      let payloadPhone = null;

      if (!matchedPatient && p.raw_payload) {
        try {
          const payload = typeof p.raw_payload === 'string' ? JSON.parse(p.raw_payload) : p.raw_payload;
          payloadEmail = payload.contact_email || payload.contactEmail ||
                        (payload.contact && payload.contact.email) || payload.email;
          payloadPhone = payload.contact_phone || payload.contactPhone ||
                        (payload.contact && payload.contact.phone) || payload.phone;
        } catch (e) {
          // ignore parse errors
        }
      }

      // Try to match by email
      if (!matchedPatient && payloadEmail) {
        matchedPatient = patients.find(pt =>
          pt.email && pt.email.toLowerCase() === payloadEmail.toLowerCase()
        );
        if (matchedPatient) matchMethod = 'email';
      }

      // Try to match by phone (normalized)
      if (!matchedPatient && payloadPhone) {
        const normalizedPhone = payloadPhone.replace(/\D/g, '').slice(-10);
        if (normalizedPhone.length === 10) {
          matchedPatient = patients.find(pt => {
            if (!pt.phone) return false;
            const patientPhone = pt.phone.replace(/\D/g, '').slice(-10);
            return patientPhone === normalizedPhone;
          });
          if (matchedPatient) matchMethod = 'phone';
        }
      }

      if (matchedPatient) {
        results.matched.push({
          purchase_id: p.id,
          purchase_date: p.purchase_date,
          item_name: p.item_name,
          amount: p.amount,
          old_patient_name: p.patient_name,
          matched_patient: {
            id: matchedPatient.id,
            name: matchedPatient.name,
            email: matchedPatient.email
          },
          match_method: matchMethod
        });

        // Apply fix if not dry run
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('purchases')
            .update({
              patient_id: matchedPatient.id,
              patient_name: matchedPatient.name
            })
            .eq('id', p.id);

          if (!updateError) {
            results.updated.push(p.id);
          }
        }
      } else {
        // Create descriptive placeholder name
        let betterName = 'Unknown';
        if (payloadEmail) {
          betterName = `Unknown (${payloadEmail})`;
        } else if (payloadPhone) {
          betterName = `Unknown (${payloadPhone})`;
        } else if (p.ghl_contact_id) {
          betterName = `Unknown (GHL: ${p.ghl_contact_id.slice(0, 8)}...)`;
        }

        results.unmatched.push({
          purchase_id: p.id,
          purchase_date: p.purchase_date,
          item_name: p.item_name,
          amount: p.amount,
          current_name: p.patient_name,
          suggested_name: betterName,
          ghl_contact_id: p.ghl_contact_id,
          payload_email: payloadEmail,
          payload_phone: payloadPhone
        });

        // Update with better name if not dry run and name differs
        if (!dryRun && betterName !== p.patient_name && betterName !== 'Unknown') {
          await supabase
            .from('purchases')
            .update({ patient_name: betterName })
            .eq('id', p.id);
        }
      }
    }

    return res.status(200).json({
      mode: dryRun ? 'preview' : 'applied',
      summary: {
        total_unknown: results.total_unknown,
        matched_count: results.matched.length,
        unmatched_count: results.unmatched.length,
        updated_count: results.updated.length
      },
      matched: results.matched,
      unmatched: results.unmatched,
      message: dryRun
        ? 'This is a preview. POST to /api/admin/fix-unknown-purchases to apply fixes.'
        : `Fixed ${results.updated.length} purchases.`
    });

  } catch (error) {
    console.error('Fix unknown purchases error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
