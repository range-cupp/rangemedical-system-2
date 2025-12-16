// /pages/api/protocol-webhook.js
// Range Medical - Payment Webhook Handler
// Creates purchase records for ALL payments
// Creates protocols for trackable items (Peptides, HRT, Weight Loss)
// v2.0 - Fixed purchase linking

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// CATEGORIZATION FUNCTIONS
// =====================================================

function categorizePurchase(productName) {
  if (!productName) return 'Other';
  const name = productName.toLowerCase();
  
  // Peptides - check first (most specific)
  // Includes GLOW, TA-1, AOD, 3x Blend protocols
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
    if (/peptide.*month|month.*program|30.*day.*peptide|30.*day.*bpc|30.*day.*protocol/i.test(name)) {
      return 'Peptide Month Program (30-Day)';
    }
    if (/maintenance|4.*week.*refill|refill/i.test(name)) {
      return 'Peptide Maintenance (4-Week Refill)';
    }
    if (/peptide.*injection|in-clinic|clinic.*injection/i.test(name)) {
      return 'Peptide Injection (In-Clinic)';
    }
    if (/14.*day|peptide.*protocol.*14/i.test(name)) {
      return 'Peptide Protocol (14-Day)';
    }
    if (/peptide.*week/i.test(name)) {
      return 'Peptide Week Supply';
    }
    
    // GLOW protocol (aesthetic)
    if (/glow/i.test(name)) {
      return 'GLOW Protocol (30-Day)';
    }
    
    // TA-1 (Thymosin Alpha-1)
    if (/ta-1/i.test(name)) {
      return 'TA-1 Protocol (30-Day)';
    }
    
    // AOD-9604
    if (/aod/i.test(name)) {
      return 'AOD-9604 Protocol (30-Day)';
    }
    
    // 3x Blend
    if (/3x blend/i.test(name)) {
      return '3x Blend Protocol (30-Day)';
    }
    
    // Specific blends
    if (/wolverine|bpc.*tb|tb.*bpc/i.test(name)) {
      if (/30/i.test(name)) return 'Wolverine Blend (BPC/TB) - 30 Day';
      if (/10/i.test(name)) return 'Wolverine Blend (BPC/TB) - 10 Day';
      return 'Wolverine Blend (BPC/TB)';
    }
    if (/ghk/i.test(name)) return 'GHK-Cu Protocol';
    if (/epitalon/i.test(name)) return 'Epitalon Protocol';
    if (/cjc.*ipa|ipa.*cjc/i.test(name)) return 'CJC/Ipamorelin Protocol';
    if (/tesa.*ipa|ipa.*tesa/i.test(name)) return 'Tesamorelin/Ipamorelin Blend';
    if (/mots/i.test(name)) return 'MOTS-C Protocol';
    if (/bpc.*157|bpc-157/i.test(name)) return 'BPC-157 Protocol';
    if (/tb.*500|tb-500/i.test(name)) return 'TB-500 Protocol';
    
    // Vials
    if (/vial/i.test(name)) {
      if (/tesa|ipa/i.test(name)) return 'Tesamorelin/Ipamorelin Vial';
      if (/bpc/i.test(name)) return 'BPC-157/TB-500 Vial';
      if (/hcg/i.test(name)) return 'HCG Vial';
      if (/reta/i.test(name)) return 'Retatrutide Vial';
      return 'Peptide Vial';
    }
    
    return 'Peptide Protocol';
  }
  
  // WEIGHT LOSS
  if (category === 'Weight Loss') {
    if (/tirzepatide/i.test(name)) return 'Tirzepatide Program';
    if (/semaglutide/i.test(name)) return 'Semaglutide Program';
    if (/retatrutide/i.test(name)) return 'Retatrutide Program';
    if (/skinny shot/i.test(name)) {
      if (/10 pack|10-pack/i.test(name)) return 'Skinny Shots (10-Pack)';
      return 'Skinny Shot';
    }
    if (/injection/i.test(name)) return 'Weight Loss Injection';
    return 'Weight Loss Program';
  }
  
  // HRT
  if (category === 'HRT') {
    if (/membership|monthly.*member/i.test(name)) return 'HRT Membership';
    if (/anastrazole/i.test(name)) return 'Anastrazole';
    if (/pellet/i.test(name)) return 'Hormone Pellet Procedure';
    if (/booster/i.test(name)) return 'Testosterone Booster';
    if (/testosterone/i.test(name)) return 'Testosterone Therapy';
    if (/estradiol/i.test(name)) return 'Estradiol Therapy';
    return 'HRT Protocol';
  }
  
  // IV THERAPY
  if (category === 'IV Therapy') {
    if (/methylene blue/i.test(name) && !/sublingual/i.test(name)) return 'Methylene Blue + Vitamin C IV';
    if (/range iv|build your own/i.test(name)) return 'Range IV (Custom)';
    if (/myers|immune/i.test(name)) return 'Immune Boost IV';
    if (/nad/i.test(name)) return 'NAD+ IV';
    if (/glutathione/i.test(name)) return 'Glutathione IV';
    if (/vitamin c/i.test(name)) return 'High Dose Vitamin C IV';
    if (/hydration/i.test(name)) return 'Hydration IV';
    if (/exosome/i.test(name)) return 'Exosome IV';
    return 'IV Therapy';
  }
  
  // INJECTIONS
  if (category === 'Injection') {
    if (/nad/i.test(name)) {
      if (/12 pack|12-pack/i.test(name)) {
        if (/100/i.test(name)) return 'NAD+ 12-Pack (100mg)';
        if (/75/i.test(name)) return 'NAD+ 12-Pack (75mg)';
        if (/50/i.test(name)) return 'NAD+ 12-Pack (50mg)';
        return 'NAD+ 12-Pack';
      }
      if (/10 pack|10-pack/i.test(name)) return 'NAD+ 10-Pack (100mg)';
      if (/8 pack|8-pack/i.test(name)) return 'NAD+ 8-Pack (50mg)';
      if (/vial/i.test(name)) return 'NAD+ Vial';
      return 'NAD+ Injection';
    }
    if (/b12|b-12/i.test(name)) return 'B12 Injection';
    if (/tri-immune/i.test(name)) return 'Tri-Immune Injection';
    if (/range injection/i.test(name)) return 'Range Injections';
    if (/torodol/i.test(name)) return 'Toradol Injection';
    if (/injection pack/i.test(name)) return 'Injection Pack';
    return 'Injection';
  }
  
  // LABS
  if (category === 'Labs') {
    if (/new patient/i.test(name)) return 'New Patient Blood Draw';
    if (/elite/i.test(name)) return 'Elite Lab Panel';
    if (/follow up/i.test(name)) return 'Follow-Up Blood Draw';
    if (/phlebotomy/i.test(name)) return 'Therapeutic Phlebotomy';
    if (/g6pd/i.test(name)) return 'G6PD Blood Test';
    return 'Blood Draw / Labs';
  }
  
  // CONSULTATION
  if (category === 'Consultation') {
    if (/gameplan/i.test(name)) return 'The Performance Gameplan';
    if (/initial/i.test(name)) return 'Initial Consultation';
    if (/hourly/i.test(name)) return 'Hourly Consultation';
    return 'Consultation';
  }
  
  // PRODUCT
  if (category === 'Product') {
    if (/sublingual/i.test(name)) return 'Methylene Blue Sublingual';
    if (/shipping/i.test(name)) return 'Shipping';
    if (/candle/i.test(name)) {
      if (/3 pack/i.test(name)) return '3-Pack Range Candles';
      return 'Range Candle';
    }
    if (/deodorant/i.test(name)) return 'Range Deodorant';
    if (/travel case/i.test(name)) return 'Travel Case';
    return 'Product';
  }
  
  // PRESCRIPTION
  if (category === 'Prescription') {
    if (/meloxicam/i.test(name)) return 'Meloxicam Prescription';
    if (/cyclobenzaprine/i.test(name)) return 'Cyclobenzaprine Prescription';
    if (/pickup/i.test(name)) return 'Medication Pickup';
    return 'Prescription';
  }
  
  // GIFT CARD
  if (category === 'Gift Card') {
    return 'Gift Card';
  }
  
  // Return original name for other categories
  return productName.substring(0, 100);
}

// Check if this purchase should create a trackable protocol
function shouldCreateProtocol(category, productName) {
  // These categories always get protocols
  if (['Peptide', 'Weight Loss'].includes(category)) {
    return true;
  }
  
  // HRT memberships get protocols
  if (category === 'HRT' && /membership|monthly/i.test(productName)) {
    return true;
  }
  
  return false;
}

// Determine protocol duration in days
function getProtocolDuration(category, productName) {
  const name = productName?.toLowerCase() || '';
  
  if (category === 'Peptide') {
    if (/10.*day|jumpstart/i.test(name)) return 10;
    if (/14.*day/i.test(name)) return 14;
    if (/week/i.test(name)) return 7;
    if (/30.*day|month|30-day|glow|ta-1|aod|3x blend/i.test(name)) return 30;
    if (/maintenance|refill|4.*week/i.test(name)) return 28;
    // Vials default to 30 days
    if (/vial/i.test(name)) return 30;
    return 30; // Default peptide duration
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
    
    // Payment info
    const amount = 
      parseFloat(payload.amount) ||
      parseFloat(payload.payment?.amount) ||
      parseFloat(payload.total) ||
      parseFloat(payload.charge_amount) ||
      0;
    
    const paymentId = 
      payload.payment_id ||
      payload.paymentId ||
      payload.invoice_id ||
      payload.invoiceId ||
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
      amount,
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
    // CREATE PURCHASE RECORD (ALL PAYMENTS)
    // =====================================================
    
    const category = categorizePurchase(productName);
    const normalizedItem = normalizeItemName(productName, category);
    
    console.log('💳 Creating purchase record:', { category, normalizedItem });
    
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
      amount: amount,
      invoice_number: paymentId || null,
      source: 'GoHighLevel',
      raw_payload: JSON.stringify(payload).substring(0, 5000) // Store raw payload for debugging
    };
    
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseData)
      .select()
      .single();
    
    if (purchaseError) {
      console.error('❌ Purchase insert error:', purchaseError);
      // Continue anyway - don't fail the whole webhook
    } else {
      console.log('✅ Purchase created:', purchase?.id);
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
        protocol_type: category,
        protocol_name: normalizedItem,
        start_date: startDate,
        end_date: endDateStr,
        duration_days: duration,
        status: 'active',
        access_token: accessToken,
        reminder_enabled: true,
        reminder_time: '18:30:00', // 6:30pm PST default
        purchase_id: purchase?.id || null,
        amount: amount
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
    // RESPONSE
    // =====================================================
    
    const trackerUrl = protocol ? 
      `https://rangemedical-system-2.vercel.app/track/${protocol.access_token}` : 
      null;
    
    const response = {
      success: true,
      purchase: {
        id: purchase?.id,
        category,
        item: normalizedItem,
        amount
      },
      protocol: protocol ? {
        id: protocol.id,
        type: category,
        name: normalizedItem,
        duration: protocol.duration_days,
        trackerUrl
      } : null,
      contact: {
        id: contactId,
        name: contactName,
        email: contactEmail
      }
    };
    
    console.log('✅ Webhook complete:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
