// /pages/api/admin/unknown-purchases.js
// Diagnostic endpoint to find Unknown purchases and their raw webhook data
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Find purchases with "Unknown" patient name
    const { data: unknownPurchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .ilike('patient_name', '%unknown%')
      .order('purchase_date', { ascending: false });

    if (purchasesError) throw purchasesError;

    // Also check webhook_logs for context
    let webhookLogs = [];
    try {
      const { data: logs } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      webhookLogs = logs || [];
    } catch (e) {
      console.log('No webhook_logs table or error:', e.message);
    }

    // Format the results with key fields exposed
    const formattedPurchases = (unknownPurchases || []).map(p => {
      let rawPayload = null;
      let contactInfo = {};

      // Parse raw_payload if available
      if (p.raw_payload) {
        try {
          rawPayload = typeof p.raw_payload === 'string'
            ? JSON.parse(p.raw_payload)
            : p.raw_payload;

          // Extract all possible contact fields from payload
          contactInfo = {
            contact_id: rawPayload.contact_id || rawPayload.contactId || rawPayload.contact?.id,
            email: rawPayload.contact_email || rawPayload.contactEmail || rawPayload.contact?.email || rawPayload.email,
            phone: rawPayload.contact_phone || rawPayload.contactPhone || rawPayload.contact?.phone || rawPayload.phone,
            first_name: rawPayload.first_name || rawPayload.firstName || rawPayload.contact?.first_name || rawPayload.contact?.firstName,
            last_name: rawPayload.last_name || rawPayload.lastName || rawPayload.contact?.last_name || rawPayload.contact?.lastName,
            full_name: rawPayload.contact_name || rawPayload.contactName || rawPayload.contact?.name || rawPayload.full_name || rawPayload.fullName || rawPayload.name
          };
        } catch (e) {
          console.log('Could not parse raw_payload:', e.message);
        }
      }

      return {
        id: p.id,
        patient_name: p.patient_name,
        patient_id: p.patient_id,
        ghl_contact_id: p.ghl_contact_id,
        item_name: p.item_name,
        amount: p.amount,
        purchase_date: p.purchase_date,
        created_at: p.created_at,
        source: p.source,
        category: p.category,
        // Extracted contact info from webhook
        ghl_contact_info: contactInfo,
        // Full raw payload for debugging
        raw_payload: rawPayload
      };
    });

    // Try to match Unknown purchases to existing patients
    const ghlContactIds = formattedPurchases
      .filter(p => p.ghl_contact_id)
      .map(p => p.ghl_contact_id);

    const emails = formattedPurchases
      .filter(p => p.ghl_contact_info?.email)
      .map(p => p.ghl_contact_info.email);

    const phones = formattedPurchases
      .filter(p => p.ghl_contact_info?.phone)
      .map(p => p.ghl_contact_info.phone);

    // Look for matching patients
    let matchingPatients = [];
    if (ghlContactIds.length > 0 || emails.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name, email, phone, ghl_contact_id')
        .or(
          [
            ghlContactIds.length > 0 ? `ghl_contact_id.in.(${ghlContactIds.join(',')})` : null,
            emails.length > 0 ? `email.in.(${emails.join(',')})` : null
          ].filter(Boolean).join(',')
        );
      matchingPatients = patients || [];
    }

    return res.status(200).json({
      unknown_purchases: {
        count: formattedPurchases.length,
        items: formattedPurchases
      },
      potential_patient_matches: matchingPatients,
      recent_webhook_logs: webhookLogs.slice(0, 10),
      summary: {
        total_unknown: formattedPurchases.length,
        with_ghl_contact_id: formattedPurchases.filter(p => p.ghl_contact_id).length,
        with_email_in_payload: formattedPurchases.filter(p => p.ghl_contact_info?.email).length,
        with_phone_in_payload: formattedPurchases.filter(p => p.ghl_contact_info?.phone).length
      }
    });

  } catch (error) {
    console.error('Unknown purchases API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
