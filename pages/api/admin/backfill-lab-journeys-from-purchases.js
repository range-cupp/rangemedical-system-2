// /pages/api/admin/backfill-lab-journeys-from-purchases.js
// One-time backfill: Create lab_journeys entries from existing lab purchases
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      endpoint: 'Backfill Lab Journeys from Purchases',
      description: 'Creates lab_journeys entries for all lab purchases that don\'t already have one',
      usage: 'POST with { dryRun: true } to preview, { dryRun: false } to execute'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dryRun = true } = req.body;

  try {
    // Get all lab purchases (category = 'Labs' or item_name contains lab/blood/panel)
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('id, patient_id, patient_name, ghl_contact_id, item_name, category, purchase_date, created_at')
      .or('category.ilike.%labs%,item_name.ilike.%lab%,item_name.ilike.%blood%,item_name.ilike.%panel%')
      .order('purchase_date', { ascending: true });

    if (purchasesError) {
      return res.status(500).json({ error: 'Failed to fetch purchases: ' + purchasesError.message });
    }

    // Get existing lab journeys to avoid duplicates
    const { data: existingJourneys, error: journeysError } = await supabase
      .from('lab_journeys')
      .select('patient_id, patient_name');

    if (journeysError) {
      return res.status(500).json({ error: 'Failed to fetch existing journeys: ' + journeysError.message });
    }

    // Build set of patient_ids that already have journeys
    const existingPatientIds = new Set(
      (existingJourneys || []).map(j => j.patient_id).filter(Boolean)
    );
    // Also track by patient_name for purchases without patient_id
    const existingPatientNames = new Set(
      (existingJourneys || []).map(j => (j.patient_name || '').toLowerCase()).filter(Boolean)
    );

    const toCreate = [];
    const skipped = [];

    for (const purchase of (purchases || [])) {
      const patientId = purchase.patient_id;
      const patientName = purchase.patient_name || 'Unknown Patient';

      // Skip if journey already exists for this patient
      if (patientId && existingPatientIds.has(patientId)) {
        skipped.push({ reason: 'already_has_journey', patient_name: patientName, item: purchase.item_name });
        continue;
      }
      if (!patientId && existingPatientNames.has(patientName.toLowerCase())) {
        skipped.push({ reason: 'already_has_journey_by_name', patient_name: patientName, item: purchase.item_name });
        continue;
      }

      // Mark this patient so we don't create duplicates within same batch
      if (patientId) existingPatientIds.add(patientId);
      existingPatientNames.add(patientName.toLowerCase());

      // If we have a patient_id but no name, look it up
      let resolvedName = patientName;
      let ghlContactId = purchase.ghl_contact_id || null;

      if (patientId && patientName === 'Unknown Patient') {
        const { data: patient } = await supabase
          .from('patients')
          .select('first_name, last_name, ghl_contact_id')
          .eq('id', patientId)
          .single();

        if (patient) {
          resolvedName = [patient.first_name, patient.last_name].filter(Boolean).join(' ') || 'Unknown Patient';
          ghlContactId = ghlContactId || patient.ghl_contact_id;
        }
      }

      toCreate.push({
        patient_id: patientId,
        patient_name: resolvedName,
        ghl_contact_id: ghlContactId,
        journey_type: 'new_patient',
        stage: 'scheduled',
      });
    }

    if (dryRun) {
      return res.status(200).json({
        dryRun: true,
        totalLabPurchases: (purchases || []).length,
        toCreate: toCreate.length,
        skipped: skipped.length,
        preview: toCreate.map(j => ({ patient_name: j.patient_name, patient_id: j.patient_id })),
        skippedDetails: skipped,
      });
    }

    // Insert journeys
    let created = 0;
    const errors = [];

    for (const journey of toCreate) {
      const { error } = await supabase
        .from('lab_journeys')
        .insert(journey);

      if (error) {
        errors.push({ patient_name: journey.patient_name, error: error.message });
      } else {
        created++;
      }
    }

    return res.status(200).json({
      success: true,
      totalLabPurchases: (purchases || []).length,
      created,
      skipped: skipped.length,
      errors,
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return res.status(500).json({ error: error.message });
  }
}
