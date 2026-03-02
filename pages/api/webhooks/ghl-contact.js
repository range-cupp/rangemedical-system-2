// pages/api/webhooks/ghl-contact.js
// Webhook endpoint to sync GHL contacts to Supabase in real-time
// Updated to handle GHL Workflow payload format

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    console.log('📥 GHL Webhook received:', JSON.stringify(payload, null, 2));
    
    // GHL sends different event types
    const eventType = payload.type || payload.event || 'contact.update';
    
    // Extract contact data - GHL Workflows send flat data, Settings webhooks send nested
    // Try nested first, then fall back to flat payload
    const contact = payload.contact || payload.data || payload;
    
    // Get the contact ID - could be in different places depending on source
    const contactId = contact.id || payload.contact_id || payload.contactId || payload.id;
    
    if (!contactId) {
      console.log('⚠️ No valid contact ID in webhook');
      return res.status(200).json({ message: 'No contact data to process' });
    }

    // Handle delete events
    if (eventType.includes('delete')) {
      console.log('🗑️ Contact deleted:', contactId);
      
      const { error } = await supabase
        .from('ghl_contacts')
        .delete()
        .eq('ghl_contact_id', contactId);
      
      if (error) {
        console.error('Delete error:', error);
        return res.status(500).json({ error: 'Failed to delete contact' });
      }
      
      return res.status(200).json({ message: 'Contact deleted', contactId });
    }

    // Transform contact data for Supabase
    // Handle both camelCase (nested) and snake_case (flat) field names
    const contactData = {
      ghl_contact_id: contactId,
      first_name: contact.firstName || contact.first_name || payload.first_name || '',
      last_name: contact.lastName || contact.last_name || payload.last_name || '',
      email: contact.email || payload.email || '',
      phone: contact.phone || payload.phone || '',
      date_of_birth: contact.dateOfBirth || contact.dob || contact.date_of_birth || payload.date_of_birth || '',
      gender: contact.gender || payload.gender || '',
      street_address: contact.address1 || contact.address || contact.street_address || payload.address1 || '',
      city: contact.city || payload.city || '',
      state: contact.state || payload.state || '',
      postal_code: contact.postalCode || contact.postal_code || payload.postal_code || '',
      tags: contact.tags || payload.tags || [],
      source: contact.source || payload.source || 'ghl_webhook',
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 Upserting contact:', contactData.first_name, contactData.last_name, '| ID:', contactId);

    // Upsert to Supabase (insert or update based on ghl_contact_id)
    const { data, error } = await supabase
      .from('ghl_contacts')
      .upsert(contactData, { 
        onConflict: 'ghl_contact_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({ error: 'Failed to sync contact', details: error.message });
    }

    console.log('✅ Contact synced:', contactData.first_name, contactData.last_name);

    // Also create/link patient record if we have email or phone
    const email = (contactData.email || '').toLowerCase().trim();
    const patientName = `${contactData.first_name} ${contactData.last_name}`.trim();

    if (email || contactData.phone) {
      try {
        // Check if patient already exists
        let patientQuery = supabase.from('patients').select('id, tags, ghl_contact_id');
        if (email) {
          patientQuery = patientQuery.eq('email', email);
        } else {
          patientQuery = patientQuery.ilike('phone', `%${contactData.phone.replace(/\D/g, '').slice(-10)}`);
        }

        const { data: existingPatient } = await patientQuery.maybeSingle();

        // Build tags from GHL contact tags
        const ghlTags = Array.isArray(contactData.tags) ? contactData.tags : [];
        const patientTags = [...new Set([...ghlTags.map(t => t.toLowerCase().replace(/\s+/g, '-'))])];

        if (existingPatient) {
          // Update existing patient with GHL contact ID and merge tags
          const existingTags = Array.isArray(existingPatient.tags) ? existingPatient.tags : [];
          const mergedTags = [...new Set([...existingTags, ...patientTags])];
          const updateData = { ghl_contact_id: contactId };
          if (mergedTags.length > 0) updateData.tags = mergedTags;

          await supabase.from('patients').update(updateData).eq('id', existingPatient.id);
          console.log(`📋 Linked GHL contact to existing patient: ${patientName}`);
        } else if (email && contactData.first_name) {
          // Create new patient from GHL contact
          const newPatientData = {
            first_name: contactData.first_name,
            last_name: contactData.last_name,
            name: patientName,
            email,
            phone: contactData.phone || null,
            ghl_contact_id: contactId,
          };
          if (patientTags.length > 0) newPatientData.tags = patientTags;

          const { data: newPt, error: ptErr } = await supabase
            .from('patients')
            .insert(newPatientData)
            .select('id')
            .single();

          if (ptErr) {
            // tags column might not exist — retry without
            if (ptErr.message && ptErr.message.includes('tags')) {
              delete newPatientData.tags;
              await supabase.from('patients').insert(newPatientData);
            } else if (!ptErr.message.includes('duplicate')) {
              console.error('Patient creation from GHL error:', ptErr.message);
            }
          } else {
            console.log(`📋 Created new patient from GHL contact: ${patientName} (${newPt.id})`);
          }
        }
      } catch (ptErr) {
        console.error('Patient sync from GHL error:', ptErr.message);
        // Non-fatal — don't fail the webhook
      }
    }

    return res.status(200).json({
      message: 'Contact synced successfully',
      contact: {
        id: contactId,
        name: `${contactData.first_name} ${contactData.last_name}`
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
