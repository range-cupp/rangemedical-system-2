// /pages/api/protocol-webhook.js
// GHL Payment Webhook - Creates purchases and links patients automatically
// Range Medical
// 
// UPDATED: 2026-01-03 - Improved payload parsing

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Categorize product by name
function categorizeProduct(productName) {
  const name = (productName || '').toLowerCase();
  
  if (name.includes('lab') || name.includes('panel') || name.includes('blood')) {
    return 'labs';
  }
  if (name.includes('iv ') || name.includes('iv-') || name.includes('infusion') || name.includes('drip')) {
    return 'iv_therapy';
  }
  if (name.includes('injection') || name.includes('nad+') || name.includes('nad +')) {
    return 'injection';
  }
  if (name.includes('peptide') || name.includes('bpc') || name.includes('tb500') || 
      name.includes('semaglutide') || name.includes('tirzepatide') || name.includes('mots')) {
    return 'peptide';
  }
  if (name.includes('hrt') || name.includes('hormone') || name.includes('testosterone')) {
    return 'hrt';
  }
  if (name.includes('weight') || name.includes('ozempic') || name.includes('wegovy')) {
    return 'weight_loss';
  }
  if (name.includes('membership') || name.includes('member')) {
    return 'membership';
  }
  if (name.includes('consult') || name.includes('visit') || name.includes('appointment')) {
    return 'consultation';
  }
  
  return 'other';
}

export default async function handler(req, res) {
  // Allow GET for webhook verification
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'Webhook active', 
      timestamp: new Date().toISOString(),
      version: '2026-01-03'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    // Log incoming webhook for debugging
    console.log('=== GHL Webhook Received ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Save raw webhook to debug table (if exists)
    try {
      await supabase.from('webhook_logs').insert({
        source: 'ghl',
        event_type: payload.type || payload.event || 'payment',
        payload: payload,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      // Table might not exist, that's ok
    }

    // Extract contact info - GHL sends data in various formats
    const contactId = 
      payload.contact_id || 
      payload.contactId || 
      payload.contact?.id ||
      payload.customData?.contact_id || 
      payload.data?.contact_id ||
      payload.id; // Sometimes GHL just sends contact ID as 'id'
    
    const firstName = 
      payload.first_name || 
      payload.firstName || 
      payload.contact?.first_name ||
      payload.contact?.firstName ||
      '';
      
    const lastName = 
      payload.last_name || 
      payload.lastName || 
      payload.contact?.last_name ||
      payload.contact?.lastName ||
      '';
    
    const contactName = 
      payload.contact_name || 
      payload.contactName || 
      payload.contact?.name || 
      payload.full_name || 
      payload.fullName ||
      payload.name ||
      `${firstName} ${lastName}`.trim() ||
      'Unknown';
    
    const contactEmail = 
      payload.contact_email || 
      payload.contactEmail || 
      payload.contact?.email || 
      payload.email;
      
    const contactPhone = 
      payload.contact_phone || 
      payload.contactPhone || 
      payload.contact?.phone || 
      payload.phone;

    // Extract invoice/payment info
    const invoiceItems = 
      payload.invoice?.items || 
      payload.items || 
      payload.line_items ||
      payload.lineItems ||
      payload.products ||
      [];
    
    const invoiceId = 
      payload.invoice?.id || 
      payload.invoice_id || 
      payload.invoiceId ||
      payload.id;
    
    const totalAmount = 
      payload.invoice?.total || 
      payload.total || 
      payload.amount ||
      payload.payment?.amount ||
      0;

    // If no contact ID, try to use email or phone to find patient
    if (!contactId && !contactEmail && !contactPhone) {
      console.log('No contact identifier in payload, skipping');
      return res.status(200).json({ status: 'skipped', reason: 'no contact identifier' });
    }

    console.log('Processing payment for:', contactName, '| Contact ID:', contactId);
    console.log('Items:', invoiceItems.length || 'none');

    // STEP 1: Find or create patient
    let patient = null;
    
    // Try to find by ghl_contact_id first
    if (contactId) {
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('ghl_contact_id', contactId)
        .single();
      
      patient = existingPatient;
    }
    
    // Try email if no patient found
    if (!patient && contactEmail) {
      const { data: emailPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('email', contactEmail)
        .single();
      
      if (emailPatient) {
        patient = emailPatient;
        // Update ghl_contact_id if missing
        if (contactId && !emailPatient.ghl_contact_id) {
          await supabase
            .from('patients')
            .update({ ghl_contact_id: contactId })
            .eq('id', emailPatient.id);
        }
      }
    }

    // Create patient if not found
    if (!patient) {
      console.log('Creating new patient:', contactName);
      
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert({
          ghl_contact_id: contactId,
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating patient:', createError);
        // Continue anyway, we can still create purchase with ghl_contact_id
      } else {
        patient = newPatient;
      }
    }

    const patientId = patient?.id || null;
    console.log('Patient ID:', patientId, '| GHL Contact ID:', contactId);

    // STEP 2: Create purchase records
    const purchaseDate = new Date().toISOString().split('T')[0];
    const purchases = [];

    // If we have line items, create a purchase for each
    if (invoiceItems && invoiceItems.length > 0) {
      for (const item of invoiceItems) {
        const itemName = item.name || item.product_name || item.productName || item.title || 'Unknown Product';
        const itemPrice = item.price || item.amount || item.unit_price || 0;
        const itemQty = item.quantity || item.qty || 1;
        
        const purchase = {
          patient_id: patientId,
          ghl_contact_id: contactId,
          patient_name: contactName,
          product_name: itemName,
          item_name: itemName,
          amount: itemPrice * itemQty,
          list_price: itemPrice * itemQty,
          purchase_date: purchaseDate,
          source: 'ghl_webhook',
          ghl_invoice_id: invoiceId,
          category: categorizeProduct(itemName),
          protocol_created: false,
          created_at: new Date().toISOString()
        };
        
        purchases.push(purchase);
      }
    } else {
      // No line items - create a single purchase from the invoice total
      const productName = 
        payload.product_name || 
        payload.productName ||
        payload.invoice?.name ||
        payload.description ||
        'Payment';
      
      const purchase = {
        patient_id: patientId,
        ghl_contact_id: contactId,
        patient_name: contactName,
        product_name: productName,
        item_name: productName,
        amount: totalAmount,
        list_price: totalAmount,
        purchase_date: purchaseDate,
        source: 'ghl_webhook',
        ghl_invoice_id: invoiceId,
        category: categorizeProduct(productName),
        protocol_created: false,
        created_at: new Date().toISOString()
      };
      
      purchases.push(purchase);
    }

    // Insert all purchases
    if (purchases.length > 0) {
      console.log('Creating', purchases.length, 'purchase(s)');
      
      const { data: inserted, error: insertError } = await supabase
        .from('purchases')
        .insert(purchases)
        .select();

      if (insertError) {
        console.error('Error inserting purchases:', insertError);
        return res.status(500).json({ error: 'Failed to create purchases', details: insertError });
      }

      console.log('Successfully created purchases:', inserted?.length);
      
      return res.status(200).json({ 
        status: 'success', 
        patient_id: patientId,
        patient_name: contactName,
        purchases_created: inserted?.length || 0,
        purchase_ids: inserted?.map(p => p.id) || []
      });
    }

    return res.status(200).json({ 
      status: 'no_purchases', 
      reason: 'No items found in payload'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Webhook processing failed', 
      message: error.message 
    });
  }
}
