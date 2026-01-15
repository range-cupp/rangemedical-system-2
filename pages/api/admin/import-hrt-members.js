// =====================================================
// IMPORT HRT MEMBERS FROM GHL
// /pages/api/admin/import-hrt-members.js
// Pulls contacts with "hrt client" tag and creates memberships
// Range Medical
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

export default async function handler(req, res) {
  // Only allow POST or GET with secret
  const secret = req.query.secret || req.headers['x-admin-secret'];
  if (secret !== process.env.CRON_SECRET && secret !== 'range-medical-cron-2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('=== IMPORTING HRT MEMBERS FROM GHL ===');

  try {
    // Step 1: Fetch all contacts with "hrt client" tag from GHL
    const contacts = await fetchHRTClients();
    console.log(`Found ${contacts.length} contacts with "hrt client" tag`);

    if (contacts.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No HRT clients found',
        imported: 0 
      });
    }

    // Step 2: Import each contact
    const results = {
      total: contacts.length,
      imported: 0,
      skipped: 0,
      errors: [],
      details: []
    };

    for (const contact of contacts) {
      try {
        const result = await importContact(contact);
        if (result.skipped) {
          results.skipped++;
          results.details.push({ 
            name: contact.contactName || contact.name, 
            status: 'skipped', 
            reason: result.reason 
          });
        } else {
          results.imported++;
          results.details.push({ 
            name: contact.contactName || contact.name, 
            status: 'imported',
            membershipId: result.membershipId
          });
        }
      } catch (error) {
        results.errors.push({
          contactId: contact.id,
          name: contact.contactName || contact.name,
          error: error.message
        });
        results.details.push({ 
          name: contact.contactName || contact.name, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    console.log('Import complete:', results);

    return res.status(200).json({
      success: true,
      message: `Imported ${results.imported} HRT members, skipped ${results.skipped}, errors: ${results.errors.length}`,
      results
    });

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// =====================================================
// Fetch all contacts with "hrt client" tag from GHL
// =====================================================
async function fetchHRTClients() {
  const allContacts = [];
  let nextPageUrl = null;
  let page = 1;

  do {
    console.log(`Fetching page ${page}...`);
    
    const url = nextPageUrl || 
      `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=100&query=hrt client`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GHL API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const contacts = data.contacts || [];
    
    // Filter to only those with "hrt client" tag
    const hrtClients = contacts.filter(c => {
      const tags = c.tags || [];
      return tags.some(tag => 
        tag.toLowerCase().includes('hrt client') || 
        tag.toLowerCase() === 'hrt'
      );
    });

    allContacts.push(...hrtClients);
    console.log(`  Found ${hrtClients.length} HRT clients on this page`);

    // Check for next page
    nextPageUrl = data.meta?.nextPageUrl || null;
    page++;

    // Safety limit
    if (page > 50) {
      console.log('Reached page limit, stopping');
      break;
    }

  } while (nextPageUrl);

  return allContacts;
}

// =====================================================
// Import a single contact as HRT member
// =====================================================
async function importContact(contact) {
  const contactId = contact.id;
  const name = contact.contactName || contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
  const email = contact.email;
  const phone = contact.phone;

  // Check if already exists
  const { data: existing } = await supabase
    .from('hrt_memberships')
    .select('id')
    .eq('ghl_contact_id', contactId)
    .maybeSingle();

  if (existing) {
    console.log(`  Skipping ${name} - already exists`);
    return { skipped: true, reason: 'Already exists' };
  }

  // Determine membership type from tags or custom fields
  const tags = (contact.tags || []).join(' ').toLowerCase();
  let membershipType = 'male_hrt'; // default
  if (tags.includes('female') || tags.includes('women')) {
    membershipType = 'female_hrt';
  }

  // Try to get HRT start date from custom fields
  let startDate = new Date();
  const customFields = contact.customFields || contact.customField || [];
  
  // Look for HRT-related date fields
  for (const field of customFields) {
    const fieldName = (field.name || field.key || '').toLowerCase();
    if (fieldName.includes('hrt') && fieldName.includes('start')) {
      if (field.value) {
        startDate = new Date(field.value);
      }
    }
  }

  // If no custom field, use contact created date as fallback
  if (!startDate || isNaN(startDate.getTime())) {
    startDate = contact.dateAdded ? new Date(contact.dateAdded) : new Date();
  }

  // Ensure start date is not in the future
  if (startDate > new Date()) {
    startDate = new Date();
  }

  console.log(`  Importing ${name} (${membershipType}, started ${startDate.toISOString().split('T')[0]})`);

  // Create the membership
  const { data: membership, error: membershipError } = await supabase
    .from('hrt_memberships')
    .insert({
      ghl_contact_id: contactId,
      patient_name: name,
      patient_email: email,
      patient_phone: phone,
      membership_type: membershipType,
      status: 'active',
      start_date: startDate.toISOString().split('T')[0],
      next_lab_due: addWeeks(startDate, 12).toISOString().split('T')[0],
      next_lab_type: 'quarterly'
    })
    .select()
    .single();

  if (membershipError) throw membershipError;

  // Create current month's period with IV available
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const periodLabel = periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const { error: periodError } = await supabase
    .from('hrt_monthly_periods')
    .insert({
      membership_id: membership.id,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      period_label: periodLabel,
      iv_available: true,
      iv_used: false,
      payment_received: true,
      payment_date: periodStart.toISOString().split('T')[0]
    });

  if (periodError) {
    console.error('Error creating period:', periodError);
  }

  return { 
    skipped: false, 
    membershipId: membership.id 
  };
}

// =====================================================
// Helper: Add weeks to date
// =====================================================
function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + (weeks * 7));
  return result;
}
