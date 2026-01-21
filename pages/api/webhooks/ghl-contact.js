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
