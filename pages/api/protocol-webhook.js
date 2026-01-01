// /pages/api/protocol-webhook.js
// GHL Payment Webhook - Creates purchases and links patients automatically
// Range Medical
// 
// PATTERN: Always look up patient by ghl_contact_id, create if not exists

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Allow GET for webhook verification
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Webhook active', timestamp: new Date().toISOString() });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    // Log incoming webhook for debugging
    console.log('=== GHL Webhook Received ===');
    console.log(JSON.stringify(payload, null, 2));

    // Extract contact info from various GHL payload formats
    const contactId = payload.contact_id || payload.contactId || payload.contact?.id || 
                      payload.customData?.contact_id || payload.data?.contact_id;
    
    const contactName = payload.contact_name || payload.contactName || payload.contact?.name || 
                        payload.full_name || payload.fullName ||
                        `${payload.first_name || payload.firstName || payload.contact?.first_name || ''} ${payload.last_name || payload.lastName || payload.contact?.last_name || ''}`.trim();
    
    const contactEmail = payload.contact_email || payload.contactEmail || payload.contact?.email || payload.email;
    const contactPhone = payload.contact_phone || payload.contactPhone || payload.contact?.phone || payload.phone;

    if (!contactId) {
      console.log('No contact_id in payload');
      return res.status(200).json({ status: 'skipped', reason: 'no contact_id' });
    }

    console.log('Contact ID:', contactId);
    console.log('Contact Name:', contactName);

    // STEP 1: Find or create patient by ghl_contact_id
    let patient = null;
    
    // Try to find existing patient
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id, name, email, phone, ghl_contact_id')
      .eq('ghl_contact_id', contactId)
      .single();

    if (existingPatient) {
      patient = existingPatient;
      console.log('Found existing patient:', patient.name, patient.id);
    } else {
      // Create new patient
      const newPatientData = {
        name: contactName || 'Unknown',
        email: contactEmail || null,
        phone: contactPhone || null,
        ghl_contact_id: contactId,
        created_at: new Date().toISOString()
      };
      
      console.log('Creating new patient:', newPatientData);
      
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert(newPatientData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating patient:', createError);
        // Try to find by email as fallback
        if (contactEmail) {
          const { data: emailPatient } = await supabase
            .from('patients')
            .select('id, name, ghl_contact_id')
            .eq('email', contactEmail)
            .single();
          
          if (emailPatient) {
            // Update existing patient with ghl_contact_id
            await supabase
              .from('patients')
              .update({ ghl_contact_id: contactId })
              .eq('id', emailPatient.id);
            patient = { ...emailPatient, ghl_contact_id: contactId };
            console.log('Linked existing patient by email:', patient.name);
          }
        }
      } else {
        patient = newPatient;
        console.log('Created new patient:', patient.name, patient.id);
      }
    }

    // STEP 2: Extract purchase/invoice info
    // GHL sends different formats depending on the trigger
    const items = payload.items || payload.line_items || payload.lineItems || 
                  payload.invoice?.items || payload.data?.items || [];
    const invoiceId = payload.invoice_id || payload.invoiceId || payload.id || 
                      payload.invoice?.id || payload.data?.invoice_id;
    const totalAmount = parseFloat(payload.amount || payload.total || payload.amount_paid || 
                                   payload.invoice?.total || payload.data?.amount || 0);
    const paymentDate = payload.payment_date || payload.paymentDate || payload.created_at || 
                        payload.date || new Date().toISOString();

    console.log('Items:', items.length);
    console.log('Invoice ID:', invoiceId);
    console.log('Total Amount:', totalAmount);

    let purchasesCreated = 0;

    // If there are line items, create a purchase for each
    if (items.length > 0) {
      for (const item of items) {
        const itemName = item.name || item.title || item.product_name || item.description || 'Unknown Item';
        const itemAmount = parseFloat(item.amount || item.price || item.unit_price || item.total || 0);
        const itemQty = parseInt(item.quantity || item.qty || 1);

        // Check for duplicate (same contact, same item, same date)
        const purchaseDate = paymentDate.split('T')[0];
        const { data: existingPurchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('ghl_contact_id', contactId)
          .eq('item_name', itemName)
          .eq('purchase_date', purchaseDate)
          .single();

        if (!existingPurchase) {
          const purchaseData = {
            patient_id: patient?.id || null,
            ghl_contact_id: contactId,
            item_name: itemName,
            product_name: itemName,
            amount: itemAmount * itemQty,
            amount_paid: itemAmount * itemQty,
            purchase_date: purchaseDate,
            invoice_id: invoiceId,
            protocol_created: false,
            dismissed: false,
            category: categorizeProduct(itemName),
            created_at: new Date().toISOString()
          };

          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert(purchaseData);

          if (purchaseError) {
            console.error('Error creating purchase:', purchaseError);
          } else {
            purchasesCreated++;
            console.log('Created purchase:', itemName, '$' + (itemAmount * itemQty));
          }
        } else {
          console.log('Duplicate purchase skipped:', itemName);
        }
      }
    } else if (totalAmount > 0) {
      // Single item payment (no line items array)
      const itemName = payload.product_name || payload.productName || payload.name || 
                       payload.title || payload.description || 'Payment';
      
      const purchaseDate = paymentDate.split('T')[0];
      
      // Check for duplicate
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('ghl_contact_id', contactId)
        .eq('item_name', itemName)
        .eq('purchase_date', purchaseDate)
        .single();

      if (!existingPurchase) {
        const purchaseData = {
          patient_id: patient?.id || null,
          ghl_contact_id: contactId,
          item_name: itemName,
          product_name: itemName,
          amount: totalAmount,
          amount_paid: totalAmount,
          purchase_date: purchaseDate,
          invoice_id: invoiceId,
          protocol_created: false,
          dismissed: false,
          category: categorizeProduct(itemName),
          created_at: new Date().toISOString()
        };

        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert(purchaseData);

        if (purchaseError) {
          console.error('Error creating purchase:', purchaseError);
        } else {
          purchasesCreated++;
          console.log('Created purchase:', itemName, '$' + totalAmount);
        }
      }
    }

    console.log('=== Webhook Complete ===');
    console.log('Patient:', patient?.name || 'Unknown');
    console.log('Purchases created:', purchasesCreated);

    return res.status(200).json({ 
      status: 'success',
      patient_name: patient?.name || 'Unknown',
      patient_id: patient?.id || null,
      contact_id: contactId,
      purchases_created: purchasesCreated
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// Categorize products for filtering
function categorizeProduct(name) {
  if (!name) return 'Other';
  const lower = name.toLowerCase();
  
  if (lower.includes('peptide') || lower.includes('bpc') || lower.includes('tb-500') || 
      lower.includes('wolverine') || lower.includes('mots') || lower.includes('ipamorelin') ||
      lower.includes('cjc') || lower.includes('tesamorelin') || lower.includes('sermorelin') ||
      lower.includes('recovery') || lower.includes('jumpstart')) {
    return 'Peptide';
  }
  if (lower.includes('iv') || lower.includes('infusion') || lower.includes('drip') ||
      lower.includes('nad+') || lower.includes('vitamin c') || lower.includes('myers') ||
      lower.includes('methylene')) {
    return 'IV';
  }
  if (lower.includes('injection') || lower.includes('shot') || lower.includes('b12') ||
      lower.includes('amino') || lower.includes('glutathione') || lower.includes('pack')) {
    return 'Injection';
  }
  if (lower.includes('weight') || lower.includes('semaglutide') || lower.includes('tirzepatide') ||
      lower.includes('skinny') || lower.includes('ozempic') || lower.includes('mounjaro')) {
    return 'Weight Loss';
  }
  if (lower.includes('hrt') || lower.includes('testosterone') || lower.includes('hormone') ||
      lower.includes('trt') || lower.includes('pellet')) {
    return 'HRT';
  }
  if (lower.includes('lab') || lower.includes('blood') || lower.includes('panel') ||
      lower.includes('elite') || lower.includes('essential') || lower.includes('draw')) {
    return 'Labs';
  }
  if (lower.includes('red light') || lower.includes('redlight')) {
    return 'Red Light';
  }
  if (lower.includes('hyperbaric') || lower.includes('hbot')) {
    return 'HBOT';
  }
  
  return 'Other';
}
