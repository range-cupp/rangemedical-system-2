// /pages/api/protocol-webhook.js
// Range Medical - Payment Webhook Handler
// v3.0 - GHL Tags + Correct Paid Amounts
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
    // First, get or create the tag
    const tagId = await getOrCreateTag(tagName);
    if (!tagId) {
      console.log('⚠️ Could not get/create tag:', tagName);
      return false;
    }

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

async function getOrCreateTag(tagName) {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) return null;

  try {
    // Try to find existing tag
    const searchResponse = await fetch(
      `https://services.leadconnectorhq.com/locations/${GHL_LOCATION_ID}/tags?query=${encodeURIComponent(tagName)}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      const existingTag = data.tags?.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      if (existingTag) {
        return existingTag.id;
      }
    }

    // Create new tag if not found
    const createResponse = await fetch(
      `https://services.leadconnectorhq.com/locations/${GHL_LOCATION_ID}/tags`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({ name: tagName })
      }
    );

    if (createResponse.ok) {
      const newTag = await createResponse.json();
      console.log(`✅ Created new tag: ${tagName}`);
      return newTag.tag?.id;
    }

    return null;
  } catch (error) {
    console.error('❌ Error with tag:', error.message);
    return null;
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
  
  // PEPTIDES
  if (category === 'Peptide') {
    // $100M Money Models - Outcome-based programs
    if (/recovery.*jumpstart|jumpstart.*10|10.*day.*peptide.*recovery/i.test(name)) {
      return 'Peptide Recovery Jumpstart (10-Day)';
    }
    if (/peptide.*month|month.*peptide|30.*day.*peptide/i.test(name)) {
      return 'Peptide Month Program (30-Day)';
    }
    if (/maintenance|refill|peptide.*4.*week/i.test(name)) {
      return 'Peptide Maintenance (4-Week)';
    }
    if (/peptide.*injection.*clinic|in.*clinic.*peptide/i.test(name)) {
      return 'Peptide Injection (In-Clinic)';
    }
    
    // Legacy/specific peptide names - map to programs
    if (/wolverine/i.test(name)) {
      if (/10.*day|10-day/i.test(name)) return 'Wolverine Blend (BPC/TB) - 10 Day';
      return 'Wolverine Blend (BPC/TB)';
    }
    if (/bpc.*tb|tb.*bpc|bpc-157.*tb|wolverine/i.test(name)) {
      if (/10.*day|10-day/i.test(name)) return 'BPC-157/TB-500 Protocol (10-Day)';
      return 'BPC-157/TB-500 Protocol';
    }
    if (/glow/i.test(name)) return 'GLOW Protocol';
    if (/ta-1|thymosin.*alpha/i.test(name)) return 'TA-1 Protocol';
    if (/aod/i.test(name)) return 'AOD Protocol';
    if (/3x.*blend/i.test(name)) return '3x Blend Protocol';
    if (/ghk/i.test(name)) return 'GHK-Cu Protocol';
    if (/epitalon/i.test(name)) return 'Epitalon Protocol';
    if (/pt-?141/i.test(name)) return 'PT-141 Protocol';
    if (/kisspeptin/i.test(name)) return 'Kisspeptin Protocol';
    if (/sermorelin|cjc|ipamorelin|tesamorelin/i.test(name)) return 'Growth Hormone Protocol';
    if (/mots/i.test(name)) return 'MOTS-c Protocol';
    if (/bpc/i.test(name)) return 'BPC-157 Protocol';
    if (/tb-?500/i.test(name)) return 'TB-500 Protocol';
    
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
  // Create protocols for trackable categories
  if (['Peptide', 'Weight Loss'].includes(category)) {
    return true;
  }
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
function getProgramType(itemName) {
  const name = itemName?.toLowerCase() || '';
  
  if (/jumpstart/i.test(name)) return 'jumpstart_10day';
  if (/10-day|10 day/i.test(name)) return 'recovery_10day';
  if (/30-day|month/i.test(name)) return 'month_30day';
  if (/injection|in-clinic/i.test(name)) return 'injection_clinic';
  if (/week/i.test(name)) return 'recovery_10day';
  
  return 'month_30day'; // default
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
    // EXTRACT DATA FROM GHL PAYLOAD
    // =====================================================
    
    // Contact info - try multiple paths
    const contactId = 
      payload.contact?.id ||
      payload.contactId ||
      payload.contact_id ||
      payload.customData?.contact_id ||
      null;
    
    const contactName = 
      payload.contact?.name ||
      payload.full_name ||
      payload.contactName ||
      `${payload.contact?.firstName || payload.first_name || ''} ${payload.contact?.lastName || payload.last_name || ''}`.trim() ||
      payload.customData?.contact_name ||
      'Unknown';
    
    const contactEmail = 
      payload.contact?.email ||
      payload.email ||
      payload.contactEmail ||
      payload.customData?.contact_email ||
      null;
    
    const contactPhone = 
      payload.contact?.phone ||
      payload.phone ||
      payload.contactPhone ||
      payload.customData?.contact_phone ||
      null;
    
    // =====================================================
    // EXTRACT CORRECT PAID AMOUNT (Invoice Total, not Line Item)
    // =====================================================
    
    // Try to get Invoice Total (actual paid amount) first
    // Fall back to other amount fields
    const invoiceTotal = 
      parseFloat(payload.invoice_total) ||
      parseFloat(payload.invoiceTotal) ||
      parseFloat(payload.total_amount) ||
      parseFloat(payload.totalAmount) ||
      parseFloat(payload.invoice?.total) ||
      null;
    
    const lineItemAmount = 
      parseFloat(payload.amount) ||
      parseFloat(payload.payment?.amount) ||
      parseFloat(payload.total) ||
      parseFloat(payload.charge_amount) ||
      parseFloat(payload.lineItems?.[0]?.amount) ||
      parseFloat(payload.items?.[0]?.price) ||
      0;
    
    // Calculate actual paid amount
    // If we have invoice subtotal and total, calculate the discount rate
    const invoiceSubtotal = 
      parseFloat(payload.invoice_sub_total) ||
      parseFloat(payload.invoiceSubTotal) ||
      parseFloat(payload.sub_total) ||
      parseFloat(payload.subTotal) ||
      parseFloat(payload.invoice?.subTotal) ||
      null;
    
    let amount;
    if (invoiceTotal !== null && invoiceSubtotal && invoiceSubtotal > 0) {
      // Calculate proportional amount for this line item
      const discountRate = invoiceTotal / invoiceSubtotal;
      amount = lineItemAmount * discountRate;
      console.log(`💰 Calculated paid amount: $${lineItemAmount} × ${discountRate.toFixed(2)} = $${amount.toFixed(2)}`);
    } else if (invoiceTotal !== null) {
      // Use invoice total directly if no line item breakdown
      amount = invoiceTotal;
      console.log(`💰 Using invoice total: $${amount}`);
    } else {
      // Fall back to line item amount
      amount = lineItemAmount;
      console.log(`💰 Using line item amount: $${amount}`);
    }
    
    const paymentId = 
      payload.payment_id ||
      payload.paymentId ||
      payload.invoice_id ||
      payload.invoiceId ||
      payload.invoice_number ||
      payload.invoiceNumber ||
      payload.id ||
      null;
    
    // Product info - try multiple paths
    let productName = 
      payload.product_name ||
      payload.productName ||
      payload.product?.name ||
      payload.name ||
      payload.title ||
      payload.customData?.product_name ||
      null;
    
    // Check for line items if no product name found
    if (!productName && payload.lineItems?.length > 0) {
      productName = payload.lineItems[0].name || payload.lineItems[0].title;
    }
    if (!productName && payload.items?.length > 0) {
      productName = payload.items[0].name || payload.items[0].title;
    }
    if (!productName && payload.products?.length > 0) {
      productName = payload.products[0].name || payload.products[0].title;
    }
    
    console.log('📋 Extracted data:', {
      contactId,
      contactName,
      contactEmail,
      contactPhone,
      productName,
      amount: amount.toFixed(2),
      paymentId
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
    // CATEGORIZE AND CREATE PURCHASE RECORD
    // =====================================================
    
    const category = categorizePurchase(productName);
    const normalizedItem = normalizeItemName(productName, category);
    
    console.log('💳 Creating purchase record:', { category, normalizedItem, amount: amount.toFixed(2) });
    
    const purchaseData = {
      ghl_contact_id: contactId || null,
      patient_name: contactName || 'Unknown',
      patient_email: contactEmail || null,
      patient_phone: contactPhone || null,
      purchase_date: new Date().toISOString().split('T')[0],
      category: category,
      item_name: normalizedItem,
      original_item_name: productName || 'Unknown',
      quantity: 1,
      amount: parseFloat(amount.toFixed(2)),
      invoice_number: paymentId || null,
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
    } else {
      console.log('✅ Purchase created:', purchase?.id);
    }

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
    
    if (shouldCreateProtocol(category, productName)) {
      console.log('📋 Creating protocol for trackable item');
      
      const duration = getProtocolDuration(category, productName);
      const accessToken = generateToken();
      const startDate = new Date().toISOString().split('T')[0];
      
      // Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const protocolData = {
        ghl_contact_id: contactId || null,
        patient_name: contactName,
        patient_email: contactEmail || null,
        patient_phone: contactPhone || null,
        program_type: getProgramType(normalizedItem),
        program_name: normalizedItem,
        start_date: startDate,
        end_date: endDateStr,
        duration_days: duration,
        status: 'active',
        access_token: accessToken,
        reminders_enabled: true,
        purchase_id: purchase?.id || null,
        amount: parseFloat(amount.toFixed(2))
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
      }
    }

    // =====================================================
    // RETURN SUCCESS RESPONSE
    // =====================================================
    
    const response = {
      success: true,
      purchase: purchase ? {
        id: purchase.id,
        category,
        item: normalizedItem,
        amount: parseFloat(amount.toFixed(2))
      } : null,
      protocol: protocol ? {
        id: protocol.id,
        access_token: protocol.access_token,
        tracker_url: `https://app.range-medical.com/track/${protocol.access_token}`
      } : null,
      tag_added: contactId && CATEGORY_TAGS[category] ? CATEGORY_TAGS[category] : null
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
