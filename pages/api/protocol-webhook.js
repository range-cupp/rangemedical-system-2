// /pages/api/protocol-webhook.js
// Range Medical - Payment Webhook Handler v3.0
// Creates purchase records + notifications for staff review
// NO auto-protocol creation - staff assigns templates manually

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function extractContactInfo(body) {
  // GHL sends data in various formats - try to find contact info
  const contact = body.contact || body.Contact || {};
  const customData = body.customData || body.custom_data || {};
  
  return {
    contactId: contact.id || body.contact_id || body.contactId || customData.contact_id,
    firstName: contact.firstName || contact.first_name || body.first_name || '',
    lastName: contact.lastName || contact.last_name || body.last_name || '',
    email: contact.email || body.email || '',
    phone: contact.phone || body.phone || ''
  };
}

function extractPaymentInfo(body) {
  const payment = body.payment || body.Payment || {};
  const invoice = body.invoice || body.Invoice || {};
  const order = body.order || body.Order || {};
  
  // Try multiple paths for product name
  let productName = payment.productName || 
                    payment.product_name ||
                    invoice.title ||
                    order.name ||
                    body.product_name ||
                    body.productName ||
                    '';
  
  // Check line items if no direct product name
  const lineItems = invoice.lineItems || invoice.line_items || order.items || [];
  if (!productName && lineItems.length > 0) {
    productName = lineItems.map(item => item.name || item.title).join(', ');
  }
  
  // Amount - GHL usually sends in cents
  let amount = payment.amount || invoice.amount || order.total || body.amount || 0;
  if (amount > 1000) amount = amount / 100; // Convert cents to dollars
  
  return {
    paymentId: payment.id || invoice.id || order.id || body.payment_id,
    productName,
    amount,
    invoiceId: invoice.id || body.invoice_id
  };
}

function categorizePurchase(productName) {
  if (!productName) return { category: 'other', suggestedTemplate: null };
  const name = productName.toLowerCase();
  
  // Peptides
  if (/peptide|bpc|tb-?500|ghk|epitalon|tesa|ipa|mots|thymosin|ta-1|kisspeptin|pt-141|melanotan|sermorelin|cjc|ipamorelin|tesamorelin|wolverine|recovery.*program|peptide.*month/.test(name)) {
    if (/10.?day|jumpstart|intensive/.test(name)) {
      return { category: 'peptide', suggestedTemplate: 'BPC-157 Recovery - 10 Day' };
    }
    if (/30.?day|month/.test(name)) {
      return { category: 'peptide', suggestedTemplate: 'BPC-157 Recovery - 30 Day' };
    }
    if (/maintenance|refill|4.?week/.test(name)) {
      return { category: 'peptide', suggestedTemplate: 'Peptide Maintenance - 4 Week' };
    }
    if (/injection|in.?clinic/.test(name)) {
      return { category: 'peptide', suggestedTemplate: 'Peptide In-Clinic Injection' };
    }
    return { category: 'peptide', suggestedTemplate: 'BPC-157 Recovery - 30 Day' };
  }
  
  // Weight Loss
  if (/semaglutide|tirzepatide|ozempic|wegovy|mounjaro|zepbound|weight|glp|skinny|retatrutide/.test(name)) {
    if (/tirzepatide|mounjaro|zepbound/.test(name)) {
      return { category: 'weight_loss', suggestedTemplate: 'Tirzepatide - 12 Week' };
    }
    if (/retatrutide/.test(name)) {
      return { category: 'weight_loss', suggestedTemplate: 'Retatrutide - 12 Week' };
    }
    if (/tesofensine/.test(name)) {
      return { category: 'weight_loss', suggestedTemplate: 'Tesofensine Oral - 30 Day' };
    }
    return { category: 'weight_loss', suggestedTemplate: 'Semaglutide - 12 Week' };
  }
  
  // HRT
  if (/hrt|hormone|testosterone|trt|cypionate|enanthate|estrogen|progesterone/.test(name)) {
    if (/hcg/.test(name)) {
      return { category: 'hrt', suggestedTemplate: 'Testosterone + HCG' };
    }
    if (/female|estrogen|progesterone/.test(name)) {
      return { category: 'hrt', suggestedTemplate: 'Female HRT' };
    }
    return { category: 'hrt', suggestedTemplate: 'Testosterone Cypionate' };
  }
  
  // Therapies
  if (/red.?light|rlt|photobiomodulation/.test(name)) {
    return { category: 'therapy', suggestedTemplate: 'Red Light Therapy - 10 Pack' };
  }
  if (/hbot|hyperbaric|oxygen/.test(name)) {
    return { category: 'therapy', suggestedTemplate: 'HBOT - 10 Pack' };
  }
  if (/iv\b|infusion|drip|hydration|nad|vitamin.*iv|myers/.test(name)) {
    if (/pack|bundle|4|5|10/.test(name)) {
      return { category: 'therapy', suggestedTemplate: 'IV Therapy - 4 Pack' };
    }
    return { category: 'therapy', suggestedTemplate: 'IV Therapy - Single' };
  }
  
  // Membership
  if (/membership|member|monthly|subscription/.test(name)) {
    return { category: 'membership', suggestedTemplate: null };
  }
  
  // Labs
  if (/lab|panel|blood|test|essential|elite/.test(name)) {
    return { category: 'labs', suggestedTemplate: null };
  }
  
  return { category: 'other', suggestedTemplate: null };
}

// =====================================================
// MAIN HANDLER
// =====================================================

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Extract info
    const contactInfo = extractContactInfo(body);
    const paymentInfo = extractPaymentInfo(body);
    const { category, suggestedTemplate } = categorizePurchase(paymentInfo.productName);

    // Validate we have minimum required data
    if (!contactInfo.contactId) {
      console.log('No contact ID found in payload');
      return res.status(200).json({ 
        success: false, 
        error: 'No contact ID found',
        received: body 
      });
    }

    const contactName = [contactInfo.firstName, contactInfo.lastName].filter(Boolean).join(' ') || 'Unknown';

    // Find or create patient
    let patientId = null;
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('ghl_contact_id', contactInfo.contactId)
      .single();

    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      // Create new patient record
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          ghl_contact_id: contactInfo.contactId,
          first_name: contactInfo.firstName || 'Unknown',
          last_name: contactInfo.lastName || '',
          email: contactInfo.email,
          phone: contactInfo.phone
        })
        .select('id')
        .single();

      if (newPatient) {
        patientId = newPatient.id;
        console.log('Created new patient:', patientId);
      } else {
        console.log('Failed to create patient:', patientError);
      }
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        patient_id: patientId,
        ghl_contact_id: contactInfo.contactId,
        ghl_payment_id: paymentInfo.paymentId,
        patient_name: contactName,
        patient_email: contactInfo.email,
        patient_phone: contactInfo.phone,
        product_name: paymentInfo.productName || 'Unknown Product',
        amount_paid: paymentInfo.amount,
        category: category,
        purchase_date: new Date().toISOString()
      })
      .select('id')
      .single();

    if (purchaseError) {
      console.log('Purchase insert error:', purchaseError);
    }

    // Create notification for staff (for trackable purchases)
    let notificationId = null;
    if (['peptide', 'weight_loss', 'hrt', 'therapy'].includes(category)) {
      const { data: notification, error: notifError } = await supabase
        .from('purchase_notifications')
        .insert({
          purchase_id: purchase?.id,
          patient_id: patientId,
          ghl_contact_id: contactInfo.contactId,
          patient_name: contactName,
          patient_email: contactInfo.email,
          product_name: paymentInfo.productName || 'Unknown Product',
          amount_paid: paymentInfo.amount,
          purchase_date: new Date().toISOString(),
          status: 'pending'
        })
        .select('id')
        .single();

      if (notification) {
        notificationId = notification.id;
        console.log('Created notification:', notificationId);
      } else {
        console.log('Notification error:', notifError);
      }
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: category === 'other' || category === 'labs' || category === 'membership'
        ? 'Purchase recorded (no protocol needed)'
        : 'Purchase recorded - notification created for staff',
      data: {
        purchaseId: purchase?.id,
        notificationId,
        patientId,
        contactId: contactInfo.contactId,
        contactName,
        productName: paymentInfo.productName,
        category,
        suggestedTemplate,
        amount: paymentInfo.amount
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
