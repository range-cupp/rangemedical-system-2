// /pages/api/admin/sync-patient-names.js
// One-time script to pull patient names from GHL and update patients table
// Range Medical - 2026-01-16

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

async function getGHLContact(contactId) {
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      console.log(`GHL API error for ${contactId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data.contact;
  } catch (error) {
    console.error(`Error fetching GHL contact ${contactId}:`, error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Optional: Add a simple auth check
  const { confirm } = req.body;
  if (confirm !== 'sync-names') {
    return res.status(400).json({ 
      error: 'Send { "confirm": "sync-names" } to run this script',
      warning: 'This will update patient records with names from GHL'
    });
  }

  try {
    // Get all patients with GHL ID but no name
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, ghl_contact_id, first_name, last_name, email, phone')
      .not('ghl_contact_id', 'is', null)
      .or('first_name.is.null,first_name.eq.');

    if (error) throw error;

    console.log(`Found ${patients.length} patients needing name sync`);

    const results = {
      total: patients.length,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    // Process each patient
    for (const patient of patients) {
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

      const contact = await getGHLContact(patient.ghl_contact_id);
      
      if (!contact) {
        results.skipped++;
        results.details.push({
          id: patient.id,
          ghl_id: patient.ghl_contact_id,
          status: 'skipped',
          reason: 'Could not fetch from GHL'
        });
        continue;
      }

      const firstName = contact.firstName || contact.name?.split(' ')[0] || null;
      const lastName = contact.lastName || contact.name?.split(' ').slice(1).join(' ') || null;

      if (!firstName && !lastName) {
        results.skipped++;
        results.details.push({
          id: patient.id,
          ghl_id: patient.ghl_contact_id,
          status: 'skipped',
          reason: 'No name in GHL contact'
        });
        continue;
      }

      // Update patient record
      const updateData = {};
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;
      // Also update email/phone if missing locally but present in GHL
      if (!patient.email && contact.email) updateData.email = contact.email;
      if (!patient.phone && contact.phone) updateData.phone = contact.phone;

      const { error: updateError } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patient.id);

      if (updateError) {
        results.errors++;
        results.details.push({
          id: patient.id,
          ghl_id: patient.ghl_contact_id,
          status: 'error',
          reason: updateError.message
        });
      } else {
        results.updated++;
        results.details.push({
          id: patient.id,
          ghl_id: patient.ghl_contact_id,
          status: 'updated',
          name: `${firstName || ''} ${lastName || ''}`.trim()
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Synced ${results.updated} patient names from GHL`,
      results
    });

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: error.message });
  }
}
