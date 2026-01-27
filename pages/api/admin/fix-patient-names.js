// /pages/api/admin/fix-patient-names.js
// Fixes patient names by pulling correct names from GHL
// Range Medical
// CREATED: 2026-01-27

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;

// Fetch contact details from GHL
async function getGHLContact(contactId) {
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.contact;
  } catch (err) {
    console.error('Error fetching GHL contact:', err);
    return null;
  }
}

// Check if name looks like a username/email prefix
function isBadName(name) {
  if (!name) return true;
  // Matches patterns like: salinasrss7, colecoker7, burns_v, j4goodm4n, eddy.reyes34
  if (/^[a-z0-9_.]+$/i.test(name)) return true;
  // No space means no last name
  if (!name.includes(' ')) return true;
  // Too short
  if (name.length < 3) return true;
  // Contains "Unknown"
  if (name.toLowerCase() === 'unknown') return true;
  // Contains intake form data
  if (name.includes('Gender:') || name.includes('Date of Birth:')) return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Find all patients with bad names
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, name, email, phone, ghl_contact_id')
      .order('name');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const badNames = patients.filter(p => isBadName(p.name));
    const withGHL = badNames.filter(p => p.ghl_contact_id);
    const withoutGHL = badNames.filter(p => !p.ghl_contact_id);

    return res.status(200).json({
      total: patients.length,
      badNames: badNames.length,
      fixableViaGHL: withGHL.length,
      needsManualFix: withoutGHL.length,
      patients: badNames.map(p => ({
        id: p.id,
        currentName: p.name,
        email: p.email,
        phone: p.phone,
        ghl_contact_id: p.ghl_contact_id,
        canAutoFix: !!p.ghl_contact_id
      }))
    });
  }

  if (req.method === 'POST') {
    const { dryRun = true } = req.body;

    // Get all patients
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, name, email, phone, ghl_contact_id');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const badPatients = patients.filter(p => isBadName(p.name) && p.ghl_contact_id);
    
    const results = {
      checked: badPatients.length,
      fixed: 0,
      failed: 0,
      details: []
    };

    for (const patient of badPatients) {
      const contact = await getGHLContact(patient.ghl_contact_id);
      
      if (contact && contact.firstName) {
        const newName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        
        if (newName && newName !== patient.name && !isBadName(newName)) {
          results.details.push({
            id: patient.id,
            oldName: patient.name,
            newName: newName,
            ghlContactId: patient.ghl_contact_id
          });

          if (!dryRun) {
            const { error: updateError } = await supabase
              .from('patients')
              .update({ 
                name: newName,
                updated_at: new Date().toISOString()
              })
              .eq('id', patient.id);

            if (updateError) {
              results.failed++;
              results.details[results.details.length - 1].error = updateError.message;
            } else {
              results.fixed++;
            }
          } else {
            results.fixed++;
          }
        }
      } else {
        results.failed++;
        results.details.push({
          id: patient.id,
          oldName: patient.name,
          error: 'Could not fetch from GHL'
        });
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return res.status(200).json({
      success: true,
      dryRun,
      results,
      message: dryRun 
        ? `Would fix ${results.fixed} names. Run with dryRun: false to apply.`
        : `Fixed ${results.fixed} names, ${results.failed} failed.`
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
