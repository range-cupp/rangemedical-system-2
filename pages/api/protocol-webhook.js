// /pages/api/protocol-webhook.js
// GHL Payment Webhook - Creates purchases and links patients automatically
// Range Medical
// 
// UPDATED: 2026-01-04 - Added raw_payload, variant capture, and GHL API lookup

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL API credentials
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// Add a note to a GHL contact
async function addNoteToGHLContact(contactId, noteBody) {
  if (!contactId) {
    console.log('No contact ID, skipping note creation');
    return null;
  }
  
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          body: noteBody
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL Note API error:', response.status, errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('GHL Note created:', result.note?.id || result.id);
    return result;
  } catch (error) {
    console.error('Error creating GHL note:', error);
    return null;
  }
}

// Format purchase note for GHL
function formatPurchaseNote(purchase) {
  const lines = [
    `💳 NEW PURCHASE`,
    ``,
    `Item: ${purchase.product_name || 'Unknown'}`,
  ];
  
  if (purchase.variant) {
    lines.push(`Variant: ${purchase.variant}`);
  }
  
  lines.push(`Amount Paid: $${(purchase.amount || 0).toFixed(2)}`);
  lines.push(`Date: ${purchase.purchase_date}`);
  lines.push(`Category: ${purchase.category || 'Other'}`);
  
  return lines.join('\n');
}

// Fetch variant name from GHL API using product_id and price_id
// NOTE: Disabled - requires Products API scope which may not be enabled
async function fetchVariantFromGHL(productId, priceId) {
  // This would require the Products API scope to be enabled on the GHL API key
  // For now, variant info must come from the webhook payload itself
  return null;
}

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
  if (name.includes('red light') || name.includes('rlt') || name.includes('redlight')) {
    return 'red_light';
  }
  if (name.includes('hbot') || name.includes('hyperbaric')) {
    return 'hbot';
  }
  
  return 'other';
}

export default async function handler(req, res) {
  // Allow GET for webhook verification
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'Webhook active', 
      timestamp: new Date().toISOString(),
      version: '2026-01-04'
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

    // Save raw webhook to debug table
    try {
      await supabase.from('webhook_logs').insert({
        source: 'ghl',
        event_type: payload.type || payload.event || 'payment',
        payload: payload,
        created_at: new Date().toISOString()
      });
      console.log('Saved to webhook_logs');
    } catch (e) {
      console.log('Could not save to webhook_logs:', e.message);
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

    // Extract invoice/payment info - GHL uses payment.line_items
    const invoiceItems = 
      payload.payment?.line_items ||
      payload.invoice?.items || 
      payload.items || 
      payload.line_items ||
      payload.lineItems ||
      payload.products ||
      [];
    
    const invoiceId = 
      payload.payment?.transaction_id ||
      payload.invoice?.id || 
      payload.invoice_id || 
      payload.invoiceId ||
      payload.id;
    
    // GHL often has total_amount as 0, use line items total instead
    let totalAmount = 
      payload.payment?.total_amount ||
      payload.invoice?.total || 
      payload.total || 
      payload.amount ||
      payload.payment?.amount ||
      payload.charge_amount ||
      payload.chargeAmount ||
      0;
    
    // If total is 0, calculate from line items
    if (totalAmount === 0 && invoiceItems.length > 0) {
      totalAmount = invoiceItems.reduce((sum, item) => {
        return sum + (item.line_price || item.price || item.amount || 0);
      }, 0);
    }

    // Log all potential payment fields for debugging
    console.log('=== Payment fields found ===');
    console.log('payment object:', JSON.stringify(payload.payment));
    console.log('line_items count:', invoiceItems.length);
    console.log('total/amount:', totalAmount);
    console.log('All top-level keys:', Object.keys(payload));

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

    // Try phone if no patient found (normalize to last 10 digits)
    if (!patient && contactPhone) {
      const normalizedPhone = (contactPhone || '').replace(/\D/g, '').slice(-10);
      if (normalizedPhone.length === 10) {
        // Search for patients with matching phone (last 10 digits)
        const { data: allPatients } = await supabase
          .from('patients')
          .select('*')
          .not('phone', 'is', null);

        const phonePatient = (allPatients || []).find(p => {
          const patientPhone = (p.phone || '').replace(/\D/g, '').slice(-10);
          return patientPhone === normalizedPhone;
        });

        if (phonePatient) {
          patient = phonePatient;
          console.log('Found patient by phone match:', phonePatient.name);
          // Update ghl_contact_id if missing
          if (contactId && !phonePatient.ghl_contact_id) {
            await supabase
              .from('patients')
              .update({ ghl_contact_id: contactId })
              .eq('id', phonePatient.id);
          }
        }
      }
    }

    // Create patient if not found
    // Use a descriptive placeholder if name is "Unknown" but we have other info
    let patientName = contactName;
    if (contactName === 'Unknown') {
      if (contactEmail) {
        patientName = `Unknown (${contactEmail})`;
      } else if (contactPhone) {
        patientName = `Unknown (${contactPhone})`;
      } else if (contactId) {
        patientName = `Unknown (GHL: ${contactId.slice(0, 8)}...)`;
      }
    }

    if (!patient) {
      console.log('Creating new patient:', patientName);
      
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert({
          ghl_contact_id: contactId,
          name: patientName,
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
    // Use the patient's actual name if found, otherwise use patientName (which may be a placeholder)
    const finalPatientName = patient?.name || patientName;
    console.log('Patient ID:', patientId, '| Patient Name:', finalPatientName, '| GHL Contact ID:', contactId);

    // STEP 2: Create purchase records
    const purchaseDate = new Date().toISOString().split('T')[0];
    const purchases = [];

    // Stringify payload for raw_payload storage
    let rawPayloadStr = null;
    try {
      rawPayloadStr = JSON.stringify(payload);
    } catch (e) {
      console.log('Could not stringify payload:', e.message);
    }

    console.log('=== Creating purchases ===');
    console.log('Invoice items count:', invoiceItems?.length || 0);
    console.log('Total amount:', totalAmount);

    // If we have line items, create a purchase for each
    if (invoiceItems && invoiceItems.length > 0) {
      console.log('Using line items to create purchases');
      for (const item of invoiceItems) {
        // GHL uses 'title' not 'name' for product name
        const itemName = item.title || item.name || item.product_name || item.productName || 'Unknown Product';
        const itemPrice = item.line_price || item.price || item.amount || item.unit_price || 0;
        const itemQty = item.quantity || item.qty || 1;
        
        // Extract variant from description field (if GHL ever sends it)
        const itemVariant = item.description || item.variant || item.option || null;
        
        console.log('Line item:', itemName, 'price:', itemPrice, 'qty:', itemQty, 'variant:', itemVariant);
        
        const purchase = {
          patient_id: patientId,
          ghl_contact_id: contactId,
          patient_name: finalPatientName,
          product_name: itemName,
          item_name: itemName,
          variant: itemVariant,
          amount: itemPrice * itemQty,
          list_price: itemPrice * itemQty,
          purchase_date: purchaseDate,
          source: 'ghl_webhook',
          ghl_invoice_id: invoiceId,
          category: categorizeProduct(itemName),
          protocol_created: false,
          raw_payload: rawPayloadStr,
          created_at: new Date().toISOString()
        };
        
        purchases.push(purchase);
      }
    } else {
      console.log('No line items - creating single purchase from total');
      // No line items - create a single purchase from the invoice total
      const productName = 
        payload.product_name || 
        payload.productName ||
        payload.payment?.calendar?.name ||
        payload.invoice?.name ||
        payload.description ||
        payload.name ||
        'Payment';
      
      // Try to get variant from top-level description
      const variant = payload.variant || payload.option || null;
      
      console.log('Product name:', productName, 'Amount:', totalAmount, 'Variant:', variant);
      
      // Only create if we have some amount or product name
      if (totalAmount > 0 || productName !== 'Payment') {
        const purchase = {
          patient_id: patientId,
          ghl_contact_id: contactId,
          patient_name: finalPatientName,
          product_name: productName,
          item_name: productName,
          variant: variant,
          amount: totalAmount,
          list_price: totalAmount,
          purchase_date: purchaseDate,
          source: 'ghl_webhook',
          ghl_invoice_id: invoiceId,
          category: categorizeProduct(productName),
          protocol_created: false,
          raw_payload: rawPayloadStr,
          created_at: new Date().toISOString()
        };
        
        purchases.push(purchase);
      } else {
        console.log('Skipping purchase - no amount and generic name');
      }
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
      
      // STEP 3: Add notes to GHL contact for each purchase
      if (contactId && inserted && inserted.length > 0) {
        console.log('Adding notes to GHL contact:', contactId);
        for (const purchase of inserted) {
          const noteBody = formatPurchaseNote(purchase);
          await addNoteToGHLContact(contactId, noteBody);
        }
      }
      
      return res.status(200).json({ 
        status: 'success', 
        patient_id: patientId,
        patient_name: finalPatientName,
        purchases_created: inserted?.length || 0,
        purchase_ids: inserted?.map(p => p.id) || [],
        notes_added: contactId ? inserted?.length : 0
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
