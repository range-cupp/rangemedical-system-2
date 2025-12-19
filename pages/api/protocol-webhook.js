// /pages/api/protocol-webhook.js
// Range Medical - Payment Webhook Handler
// v4.0 - Fixed GHL Payload Parsing
// Creates purchase records for ALL payments
// Creates protocols for trackable items (Peptides, HRT, Weight Loss)
// Adds GHL tags based on purchase category

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL API configuration
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// =====================================================
// SEND SMS VIA GHL
// =====================================================
async function sendWelcomeSMS(contactId, patientName, programName, accessToken) {
  if (!GHL_API_KEY || !contactId) {
    console.log('⚠️ Cannot send SMS - missing API key or contact ID');
    return false;
  }

  try {
    const firstName = patientName ? patientName.split(' ')[0] : 'there';
    const trackerUrl = `https://app.range-medical.com/track/${accessToken}`;
    
    const message = `Hi ${firstName}! Your ${programName} protocol is ready. Track your progress and log injections here: ${trackerUrl}\n\nPlease complete the quick starting assessment so we can measure your improvement. Questions? Call us at (949) 997-3988 - Range Medical`;

    const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: contactId,
        message: message
      })
    });

    if (response.ok) {
      console.log(`✅ Welcome SMS sent to ${patientName}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`⚠️ Failed to send SMS: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    return false;
  }
}

// =====================================================
// GHL TAG MAPPING BY CATEGORY
// =====================================================
const CATEGORY_TAGS = {
  'Peptide': 'Peptide Patient',
  'Weight Loss': 'Weight Loss Patient',
  'HRT': 'HRT Member',
  'IV Therapy': 'IV Therapy Patient',
  'Injection': 'Injection Patient',
  'Labs': 'Labs Patient',
  'Hyperbaric': 'Hyperbaric Patient',
  'Red Light': 'Red Light Patient',
  'Consultation': 'Consultation',
  'Product': 'Product Purchase',
  'Prescription': 'Prescription',
  'Gift Card': 'Gift Card'
};

// =====================================================
// GHL API FUNCTIONS
// =====================================================

async function addTagToContact(contactId, tagName) {
  if (!GHL_API_KEY || !contactId || !tagName) {
    console.log('⚠️ Cannot add tag - missing API key, contact ID, or tag name');
    return false;
  }

  try {
    // Add tag to contact
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({ tags: [tagName] })
    });

    if (response.ok) {
      console.log(`✅ Added tag "${tagName}" to contact ${contactId}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`⚠️ Failed to add tag: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error adding tag:', error.message);
    return false;
  }
}

// =====================================================
// CATEGORIZATION FUNCTIONS
// =====================================================

function categorizePurchase(productName) {
  if (!productName) return 'Other';
  const name = productName.toLowerCase();
  
  // Peptides - check first (most specific)
  if (/peptide|bpc|tb-?500|ghk|epitalon|tesa|ipa|mots|thymosin|ta-1|kisspeptin|pt-141|melanotan|sermorelin|cjc|ipamorelin|tesamorelin|wolverine|recovery.*program|recovery.*jumpstart|peptide.*month|peptide.*maintenance|glow|aod|3x blend/i.test(name)) {
    return 'Peptide';
  }
  
  // Weight Loss - includes Skinny Shot
  if (/weight loss|tirzepatide|semaglutide|retatrutide|weight-loss|ozempic|mounjaro|skinny shot/i.test(name)) {
    return 'Weight Loss';
  }
  
  // HRT/TRT - includes Anastrazole
  if (/hrt|trt|testosterone|hormone|pellet|estradiol|progesterone|membership|monthly.*member|anastrazole/i.test(name)) {
    return 'HRT';
  }
  
  // IV Therapy (check before injections to avoid false matches)
  if (/\biv\b|infusion|hydration|myers|methylene blue.*iv|vitamin c.*iv|glutathione iv|nad\+ iv|exosome|glow iv|detox iv|energy iv|recovery iv|hangover|drip|range iv/i.test(name)) {
    return 'IV Therapy';
  }
  
  // Labs - includes Therapeutic Phlebotomy
  if (/lab|blood draw|blood test|panel|g6pd|diagnostic|bloodwork|phlebotomy/i.test(name)) {
    return 'Labs';
  }
  
  // Injections - includes NAD+ packs (12-pack, 10-pack, 8-pack), Range Injections
  if (/nad\+ injection|nad injection|nad\+\s*\(|nad\+ 12|nad\+ 10|nad\+ 8|12 pack|12-pack|10 pack|10-pack|8 pack|8-pack|b12|b-12|torodol|injection therapy|vitamin d|injection pack|tri-immune|range injection/i.test(name)) {
    return 'Injection';
  }
  // NAD+ vials and packs
  if (/nad/.test(name) && (/vial|pack/.test(name))) {
    return 'Injection';
  }
  
  // Hyperbaric
  if (/hyperbaric|hbot/i.test(name)) {
    return 'Hyperbaric';
  }
  
  // Red Light
  if (/red light|pbm|photobiomodulation/i.test(name)) {
    return 'Red Light';
  }
  
  // Consultation - includes Performance Gameplan
  if (/consult|review|follow up|assessment|encounter|visit|hourly|gameplan/i.test(name)) {
    return 'Consultation';
  }
  
  // Product - candles, deodorant, shipping, travel case, sublingual
  if (/sublingual|shipping|metagenics|travel case|candle|deodorant/i.test(name)) {
    return 'Product';
  }
  
  // Prescription
  if (/prescription|medication pickup/i.test(name)) {
    return 'Prescription';
  }
  
  // Gift Card
  if (/gift card/i.test(name)) {
    return 'Gift Card';
  }
  
  return 'Other';
}

function normalizeItemName(productName, category) {
  if (!productName) return 'Unknown';
  const name = productName.toLowerCase();
  
  // PEPTIDES - $100M Money Models naming
  if (category === 'Peptide') {
    // Peptide Recovery Jumpstart – 10 Day
    if (/recovery.*jumpstart|jumpstart.*10|10.*day.*peptide.*recovery|peptide.*10.*day|10-day.*protocol/i.test(name)) {
      return 'Peptide Recovery Jumpstart – 10 Day';
    }
    
    // Peptide Month Program – 30 Day
    if (/peptide.*month|month.*peptide|30.*day.*peptide|peptide.*30.*day/i.test(name)) {
      return 'Peptide Month Program – 30 Day';
    }
    
    // Peptide Maintenance – 4-Week Refill
    if (/maintenance|refill|peptide.*4.*week/i.test(name)) {
      return 'Peptide Maintenance – 4-Week Refill';
    }
    
    // Peptide Injection (In-Clinic)
    if (/peptide.*injection.*clinic|in.*clinic.*peptide/i.test(name)) {
      return 'Peptide Injection (In-Clinic)';
    }
    
    // Specific peptide blends - append to appropriate program name
    if (/wolverine/i.test(name)) {
      if (/10.*day|10-day/i.test(name)) return 'Wolverine Blend (BPC/TB) – 10 Day';
      return 'Wolverine Blend (BPC/TB) – 30 Day';
    }
    if (/bpc.*tb|tb.*bpc|bpc-157.*tb/i.test(name)) {
      if (/10.*day|10-day/i.test(name)) return 'BPC-157/TB-500 – 10 Day';
      return 'BPC-157/TB-500 – 30 Day';
    }
    if (/glow/i.test(name)) return 'GLOW Protocol – 30 Day';
    if (/ta-1|thymosin.*alpha/i.test(name)) return 'TA-1 Protocol – 30 Day';
    if (/aod/i.test(name)) return 'AOD Protocol – 30 Day';
    if (/3x.*blend/i.test(name)) return '3x Blend Protocol – 30 Day';
    if (/ghk/i.test(name)) return 'GHK-Cu Protocol – 30 Day';
    if (/epitalon/i.test(name)) return 'Epitalon Protocol – 30 Day';
    if (/pt-?141/i.test(name)) return 'PT-141 Protocol';
    if (/kisspeptin/i.test(name)) return 'Kisspeptin Protocol';
    if (/sermorelin|cjc|ipamorelin|tesamorelin/i.test(name)) return 'Growth Hormone Protocol – 30 Day';
    if (/mots/i.test(name)) return 'MOTS-c Protocol – 30 Day';
    if (/bpc/i.test(name)) {
      if (/10.*day|10-day/i.test(name)) return 'BPC-157 – 10 Day';
      return 'BPC-157 – 30 Day';
    }
    if (/tb-?500/i.test(name)) {
      if (/10.*day|10-day/i.test(name)) return 'TB-500 – 10 Day';
      return 'TB-500 – 30 Day';
    }
    
    return productName; // Return original if no match
  }
  
  // WEIGHT LOSS
  if (category === 'Weight Loss') {
    if (/tirzepatide/i.test(name)) return 'Tirzepatide Program';
    if (/semaglutide/i.test(name)) return 'Semaglutide Program';
    if (/retatrutide/i.test(name)) return 'Retatrutide Program';
    if (/skinny.*shot/i.test(name)) {
      if (/3x|3 pack|three/i.test(name)) return 'Skinny Shot (3-Pack)';
      return 'Skinny Shot';
    }
    return productName;
  }
  
  // HRT
  if (category === 'HRT') {
    if (/membership|monthly.*member/i.test(name)) return 'HRT Membership';
    if (/testosterone/i.test(name)) return 'Testosterone Therapy';
    if (/pellet/i.test(name)) return 'Hormone Pellet Therapy';
    if (/anastrazole/i.test(name)) return 'Anastrazole';
    return productName;
  }
  
  // IV THERAPY
  if (category === 'IV Therapy') {
    if (/myers/i.test(name)) return 'Myers Cocktail IV';
    if (/hydration/i.test(name)) return 'Hydration IV';
    if (/nad/i.test(name)) return 'NAD+ IV';
    if (/methylene/i.test(name)) return 'Methylene Blue IV';
    if (/vitamin.*c/i.test(name)) return 'Vitamin C IV';
    if (/glutathione/i.test(name)) return 'Glutathione IV';
    if (/exosome/i.test(name)) return 'Exosome IV';
    if (/hangover/i.test(name)) return 'Hangover Recovery IV';
    if (/energy/i.test(name)) return 'Energy IV';
    if (/recovery/i.test(name)) return 'Recovery IV';
    if (/detox/i.test(name)) return 'Detox IV';
    if (/glow/i.test(name)) return 'Glow IV';
    if (/range.*iv/i.test(name)) return 'Range IV';
    return productName;
  }
  
  // INJECTIONS
  if (category === 'Injection') {
    if (/nad/i.test(name)) {
      if (/12.*pack|12-pack/i.test(name)) return 'NAD+ Injection (12-Pack)';
      if (/10.*pack|10-pack/i.test(name)) return 'NAD+ Injection (10-Pack)';
      if (/8.*pack|8-pack/i.test(name)) return 'NAD+ Injection (8-Pack)';
      if (/vial/i.test(name)) return 'NAD+ Vial';
      return 'NAD+ Injection';
    }
    if (/b-?12/i.test(name)) return 'B12 Injection';
    if (/vitamin.*d/i.test(name)) return 'Vitamin D Injection';
    if (/tri-?immune/i.test(name)) return 'Tri-Immune Injection';
    if (/torodol/i.test(name)) return 'Torodol Injection';
    if (/range.*injection/i.test(name)) return 'Range Injection';
    return productName;
  }
  
  // LABS
  if (category === 'Labs') {
    if (/phlebotomy/i.test(name)) return 'Therapeutic Phlebotomy';
    if (/comprehensive|full/i.test(name)) return 'Comprehensive Lab Panel';
    if (/basic/i.test(name)) return 'Basic Lab Panel';
    if (/hormone/i.test(name)) return 'Hormone Panel';
    if (/thyroid/i.test(name)) return 'Thyroid Panel';
    if (/g6pd/i.test(name)) return 'G6PD Test';
    return productName;
  }
  
  // HYPERBARIC
  if (category === 'Hyperbaric') {
    if (/single|session/i.test(name)) return 'Hyperbaric Session (Single)';
    if (/pack|series/i.test(name)) return 'Hyperbaric Sessions (Pack)';
    return 'Hyperbaric Oxygen Therapy';
  }
  
  // RED LIGHT
  if (category === 'Red Light') {
    if (/single|session/i.test(name)) return 'Red Light Session (Single)';
    if (/pack|series/i.test(name)) return 'Red Light Sessions (Pack)';
    return 'Red Light Therapy';
  }
  
  return productName;
}

function shouldCreateProtocol(category, productName) {
  // DISABLED - Protocols are now created manually by staff
  // Webhook only creates purchase records
  return false;
}

function getProtocolDuration(category, productName) {
  if (!productName) return 30;
  const name = productName.toLowerCase();
  
  if (category === 'Peptide') {
    // Jumpstart and 10-day programs
    if (/jumpstart|10.*day|10-day|week/i.test(name)) return 10;
    // 14-day programs
    if (/14.*day|14-day|two.*week|2.*week/i.test(name)) return 14;
    // Maintenance (4-week)
    if (/maintenance|refill|4.*week/i.test(name)) return 28;
    // Monthly/30-day programs
    if (/month|30.*day|30-day/i.test(name)) return 30;
    // GLOW, TA-1, AOD, 3x Blend - default 30 days
    if (/glow|ta-1|aod|3x.*blend/i.test(name)) return 30;
    // Vials - default 30 days
    if (/vial/i.test(name)) return 30;
    // In-clinic injection
    if (/in.*clinic|injection/i.test(name) && !/pack/i.test(name)) return 1;
  }
  
  if (category === 'Weight Loss') {
    if (/skinny shot/i.test(name) && !/pack/i.test(name)) return 7; // Single shot
    if (/week/i.test(name)) return 7;
    return 30; // Monthly by default
  }
  
  if (category === 'HRT') {
    return 30; // Monthly membership
  }
  
  return 30;
}

// Generate unique access token
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Map item name to allowed program_type values
function getProgramType(itemName, category) {
  const name = itemName?.toLowerCase() || '';
  
  // WEIGHT LOSS - separate from peptides
  if (category === 'Weight Loss') {
    // Skinny Shot and single injections
    if (/skinny.*shot|injection/i.test(name) && !/program|month|weekly/i.test(name)) {
      return 'weight_loss_injection';
    }
    // Monthly programs (Tirzepatide, Semaglutide, etc.)
    return 'weight_loss_program';
  }
  
  // PEPTIDES
  // 10-Day programs -> Recovery Jumpstart
  if (/jumpstart|10-day|10 day|recovery.*10|10.*day/i.test(name)) {
    return 'recovery_jumpstart_10day';
  }
  
  // In-clinic injection
  if (/injection|in-clinic/i.test(name)) {
    return 'injection_clinic';
  }
  
  // Maintenance/Refill explicitly mentioned
  if (/maintenance|refill|4.*week|4-week/i.test(name)) {
    return 'maintenance_4week';
  }
  
  // 30-Day/Month programs - will be determined as month_program or maintenance later
  if (/30-day|30 day|month/i.test(name)) {
    return 'month_program_30day'; // Default, may be changed to maintenance
  }
  
  // Week programs -> Recovery Jumpstart
  if (/week/i.test(name)) {
    return 'recovery_jumpstart_10day';
  }
  
  return 'recovery_jumpstart_10day'; // default to 10-day
}

// Check if patient already has a 30-day program (to determine if this is maintenance)
async function checkIfMaintenance(supabase, contactId) {
  if (!contactId) return false;
  
  try {
    const { data, error } = await supabase
      .from('protocols')
      .select('id')
      .eq('ghl_contact_id', contactId)
      .in('program_type', ['month_program_30day', 'month_30day'])
      .limit(1);
    
    if (error) {
      console.error('Error checking for existing protocols:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (err) {
    console.error('Error in checkIfMaintenance:', err);
    return false;
  }
}

// =====================================================
// MAIN WEBHOOK HANDLER
// =====================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📥 Webhook received at:', new Date().toISOString());
  console.log('📦 Raw payload:', JSON.stringify(req.body, null, 2));

  try {
    const payload = req.body;
    
    // =====================================================
    // CHECK IF THIS IS A REAL PAYMENT (not contact update)
    // =====================================================
    
    const payment = payload.payment || {};
    
    // If there's no payment object, this is NOT a payment webhook - skip it
    if (!payment || Object.keys(payment).length === 0) {
      console.log('⚠️ No payment object found - this is not a payment webhook, skipping');
      return res.status(200).json({ 
        success: true, 
        skipped: true,
        reason: 'Not a payment webhook (no payment object)'
      });
    }
    
    // Check payment status - only process completed payments
    const paymentStatus = payment.payment_status || payment.status || '';
    if (paymentStatus && !['succeeded', 'completed', 'paid'].includes(paymentStatus.toLowerCase())) {
      console.log('⚠️ Payment status is not completed:', paymentStatus);
      return res.status(200).json({ 
        success: true, 
        skipped: true,
        reason: `Payment status: ${paymentStatus}`
      });
    }
    
    // =====================================================
    // EXTRACT DATA FROM GHL PAYLOAD - v5.0 WITH LIST PRICE
    // GHL sends data in: payload.payment.line_items[0]
    // =====================================================
    
    const lineItems = payment.line_items || [];
    const firstItem = lineItems[0] || {};
    const invoice = payment.invoice || {};
    const customer = payment.customer || {};
    
    // Contact info - try multiple paths
    const contactId = 
      payload.contact_id ||
      payload.contactId ||
      customer.id ||
      payload.contact?.id ||
      null;
    
    const contactName = 
      payload.full_name ||
      customer.name ||
      `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
      `${payload.first_name || ''} ${payload.last_name || ''}`.trim() ||
      payload.contact?.name ||
      'Unknown';
    
    const contactEmail = 
      payload.email ||
      customer.email ||
      payload.contact?.email ||
      null;
    
    const contactPhone = 
      payload.phone ||
      customer.phone ||
      payload.contact?.phone ||
      null;
    
    // =====================================================
    // EXTRACT PRODUCT INFO FROM LINE ITEMS - FIXED!
    // =====================================================
    
    // Product name from line_items[0].title
    const productName = 
      firstItem.title ||
      firstItem.name ||
      payload.product_name ||
      payload.productName ||
      'Unknown';
    
    // Quantity from line_items[0].quantity
    const quantity = 
      parseInt(firstItem.quantity) ||
      parseInt(payload.quantity) ||
      1;
    
    // =====================================================
    // AMOUNT - Check multiple sources in priority order
    // =====================================================
    
    // 1. Check for custom field "Amount Paid" (manually entered actual amount)
    const customAmountPaid = 
      parseFloat(payload['Amount Paid']) ||
      parseFloat(payload.amount_paid) ||
      parseFloat(payload.amountPaid) ||
      null;
    
    // 2. Line item price
    const lineItemPrice = 
      parseFloat(firstItem.line_price) ||
      parseFloat(firstItem.price) ||
      0;
    
    // 3. Payment/invoice totals
    const totalAmount = 
      parseFloat(payment.total_amount) ||
      parseFloat(invoice.amount_paid) ||
      lineItemPrice ||
      0;
    
    // Priority: Custom "Amount Paid" > Payment total (for single item) > Line item price
    let amount;
    if (customAmountPaid !== null && customAmountPaid > 0) {
      amount = customAmountPaid;
      console.log('💰 Using custom Amount Paid field:', amount);
    } else if (lineItems.length === 1) {
      amount = totalAmount;
      console.log('💰 Using payment total:', amount);
    } else {
      amount = lineItemPrice;
      console.log('💰 Using line item price:', amount);
    }
    
    // Invoice number
    const invoiceNumber = 
      invoice.number ||
      payment.transaction_id ||
      payload.invoice_number ||
      null;
    
    console.log('📋 Extracted data (v4.0):', {
      contactId,
      contactName,
      contactEmail,
      contactPhone,
      productName,
      quantity,
      amount: amount.toFixed(2),
      invoiceNumber,
      lineItemsCount: lineItems.length
    });

    // =====================================================
    // VALIDATE MINIMUM DATA
    // =====================================================
    
    if (!contactId && !contactEmail && !contactPhone) {
      console.log('⚠️ No contact identifier found');
      return res.status(200).json({ 
        success: false, 
        error: 'No contact identifier',
        message: 'Payment received but no contact info to link it to'
      });
    }

    // =====================================================
    // CREATE/UPDATE PATIENT RECORD
    // =====================================================
    
    let patientId = null;
    
    if (contactId) {
      // Check if patient exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', contactId)
        .maybeSingle();
      
      if (existingPatient) {
        patientId = existingPatient.id;
        console.log('👤 Found existing patient:', patientId);
        
        // Update patient info if we have new data
        await supabase
          .from('patients')
          .update({
            name: contactName || undefined,
            phone: contactPhone || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', patientId);
      } else {
        // Create new patient record
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            ghl_contact_id: contactId,
            name: contactName || 'Unknown',
            email: contactEmail || null,
            phone: contactPhone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (patientError) {
          console.error('⚠️ Patient creation error:', patientError);
          // Don't fail - continue with purchase creation
        } else {
          patientId = newPatient.id;
          console.log('✅ Created new patient:', patientId, contactName);
        }
      }
    }

    // =====================================================
    // PROCESS EACH LINE ITEM (Support multi-item invoices)
    // =====================================================
    
    const results = [];
    const itemsToProcess = lineItems.length > 0 ? lineItems : [{ title: productName, price: amount, quantity: quantity }];
    
    for (const item of itemsToProcess) {
      const itemName = item.title || item.name || productName;
      const itemQuantity = parseInt(item.quantity) || 1;
      
      // LIST PRICE = original price before discounts
      const itemListPrice = parseFloat(item.price) || 0;
      
      // AMOUNT PAID = actual amount after discounts (line_price)
      // line_price is what they actually paid for this item
      const itemAmount = parseFloat(item.line_price) || parseFloat(item.price) || 0;
      
      console.log('💰 Prices:', {
        list_price: itemListPrice,
        amount_paid: itemAmount,
        discount: itemListPrice - itemAmount
      });
      
      // =====================================================
      // CATEGORIZE PURCHASE
      // =====================================================
      
      const category = categorizePurchase(itemName);
      const normalizedItem = normalizeItemName(itemName, category);
      
      console.log('💳 Processing line item:', { 
        itemName,
        category, 
        normalizedItem, 
        quantity: itemQuantity,
        amount: itemAmount.toFixed(2) 
      });

      // =====================================================
      // CHECK FOR DUPLICATE PURCHASE
      // =====================================================
      
      const purchaseDate = new Date().toISOString().split('T')[0];
      
      let existingPurchase = null;
      
      // Check by invoice number + item name (most reliable for multi-item invoices)
      if (invoiceNumber) {
        const { data: byInvoice } = await supabase
          .from('purchases')
          .select('id')
          .eq('invoice_number', invoiceNumber)
          .eq('item_name', normalizedItem)
          .maybeSingle();
        existingPurchase = byInvoice;
        if (existingPurchase) {
          console.log('⚠️ Duplicate found by invoice_number + item:', invoiceNumber, normalizedItem);
        }
      }
      
      // Check by exact match (patient + item + date + amount)
      if (!existingPurchase && contactId) {
        const { data: byDetails } = await supabase
          .from('purchases')
          .select('id')
          .eq('ghl_contact_id', contactId)
          .eq('item_name', normalizedItem)
          .eq('purchase_date', purchaseDate)
          .eq('amount', parseFloat(itemAmount.toFixed(2)))
          .maybeSingle();
        existingPurchase = byDetails;
        if (existingPurchase) {
          console.log('⚠️ Duplicate found by exact match');
        }
      }
      
      if (existingPurchase) {
        console.log('⚠️ Skipping duplicate purchase:', existingPurchase.id);
        results.push({
          success: true,
          duplicate: true,
          item: normalizedItem,
          existing_id: existingPurchase.id
        });
        continue;
      }

      // =====================================================
      // CREATE PURCHASE RECORD
      // =====================================================
      
      const purchaseData = {
        ghl_contact_id: contactId || null,
        patient_name: contactName || 'Unknown',
        patient_email: contactEmail || null,
        patient_phone: contactPhone || null,
        purchase_date: purchaseDate,
        category: category,
        item_name: normalizedItem,
        original_item_name: itemName,
        quantity: itemQuantity,
        list_price: parseFloat(itemListPrice.toFixed(2)),
        amount: parseFloat(itemAmount.toFixed(2)),
        invoice_number: invoiceNumber || null,
        source: 'GoHighLevel',
        raw_payload: JSON.stringify(payload).substring(0, 5000)
      };
      
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single();
      
      if (purchaseError) {
        console.error('❌ Purchase insert error:', purchaseError);
        results.push({ success: false, error: purchaseError.message, item: normalizedItem });
        continue;
      }
      
      console.log('✅ Purchase created:', purchase?.id);

      // =====================================================
      // ADD GHL TAG BASED ON CATEGORY
      // =====================================================
      
      if (contactId && CATEGORY_TAGS[category]) {
        const tagName = CATEGORY_TAGS[category];
        console.log(`🏷️ Adding tag "${tagName}" to contact ${contactId}`);
        await addTagToContact(contactId, tagName);
      }

      // =====================================================
      // CREATE PROTOCOL (IF TRACKABLE)
      // =====================================================
      
      let protocol = null;
      
      if (shouldCreateProtocol(category, itemName)) {
        console.log('📋 Creating protocol for trackable item');
        
        const duration = getProtocolDuration(category, itemName);
        const accessToken = generateToken();
        const startDate = new Date().toISOString().split('T')[0];
        
        // Calculate end date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Determine program type (pass category for Weight Loss distinction)
        let programType = getProgramType(normalizedItem, category);
        
        // If it's a 30-day peptide program, check if patient already has one (making this a maintenance/refill)
        if (programType === 'month_program_30day' && contactId) {
          const isMaintenance = await checkIfMaintenance(supabase, contactId);
          if (isMaintenance) {
            programType = 'maintenance_4week';
            console.log('📋 Patient has existing 30-day program, marking as maintenance');
          }
        }
        
        const protocolData = {
          ghl_contact_id: contactId || null,
          patient_name: contactName,
          patient_email: contactEmail || null,
          patient_phone: contactPhone || null,
          program_type: programType,
          program_name: normalizedItem,
          start_date: startDate,
          end_date: endDateStr,
          duration_days: duration,
          status: 'active',
          access_token: accessToken,
          reminders_enabled: true,
          purchase_id: purchase?.id || null,
          amount: parseFloat(itemAmount.toFixed(2)),
          total_sessions: itemQuantity > 1 ? itemQuantity : null
        };
        
        const { data: newProtocol, error: protocolError } = await supabase
          .from('protocols')
          .insert(protocolData)
          .select()
          .single();
        
        if (protocolError) {
          console.error('❌ Protocol insert error:', protocolError);
        } else {
          protocol = newProtocol;
          console.log('✅ Protocol created:', {
            id: protocol.id,
            type: category,
            name: normalizedItem,
            duration,
            token: accessToken
          });
          
          // Link purchase to protocol
          if (purchase?.id) {
            await supabase
              .from('purchases')
              .update({ protocol_id: protocol.id })
              .eq('id', purchase.id);
          }
          
          // Send welcome SMS with tracker link for Peptide and Weight Loss protocols
          if ((category === 'Peptide' || category === 'Weight Loss') && contactId) {
            await sendWelcomeSMS(contactId, contactName, normalizedItem, accessToken);
          }
        }
      }

      results.push({
        success: true,
        purchase: purchase ? {
          id: purchase.id,
          category,
          item: normalizedItem,
          quantity: itemQuantity,
          list_price: parseFloat(itemListPrice.toFixed(2)),
          amount: parseFloat(itemAmount.toFixed(2))
        } : null,
        protocol: protocol ? {
          id: protocol.id,
          access_token: protocol.access_token,
          tracker_url: `https://app.range-medical.com/track/${protocol.access_token}`
        } : null,
        tag_added: contactId && CATEGORY_TAGS[category] ? CATEGORY_TAGS[category] : null
      });
    }

    // =====================================================
    // RETURN SUCCESS RESPONSE
    // =====================================================
    
    const response = {
      success: true,
      items_processed: results.length,
      results
    };
    
    console.log('✅ Webhook processed successfully:', response);
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
