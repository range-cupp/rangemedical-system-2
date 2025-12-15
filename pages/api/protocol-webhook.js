// /pages/api/protocol-webhook.js
// Webhook handler: GHL Payment → Supabase Protocol Tracker → GHL Contact Update
// Range Medical Protocol Tracking System

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for full access
);

// GHL Config
const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// =====================================================
// PROGRAM MAPPING
// Maps GHL product names to protocol types
// Uses lowercase keys for case-insensitive matching
// =====================================================

// New 4-SKU Architecture:
// 1. Peptide Recovery Jumpstart – 10 Day ($297)
// 2. Peptide Month Program – 30 Day ($697)
// 3. Peptide Maintenance – 4-Week Refill ($297)
// 4. Peptide Injection – In-Clinic ($89)

const PROGRAM_MAPPING = {
  // === NEW SKUs ===
  // Jumpstart 10-Day
  'peptide recovery jumpstart - 10 day': {
    type: 'jumpstart_10day',
    duration: 10,
    category: 'jumpstart'
  },
  'peptide recovery jumpstart – 10 day': {
    type: 'jumpstart_10day',
    duration: 10,
    category: 'jumpstart'
  },
  
  // Month Program 30-Day (duration adjusted based on frequency when edited)
  'peptide month program - 30 day': {
    type: 'month_30day',
    duration: 30,
    category: 'month'
  },
  'peptide month program – 30 day': {
    type: 'month_30day',
    duration: 30,
    category: 'month'
  },
  
  // Maintenance 4-Week Refill
  'peptide maintenance - 4-week refill': {
    type: 'maintenance_28day',
    duration: 28,
    category: 'maintenance'
  },
  'peptide maintenance – 4-week refill': {
    type: 'maintenance_28day',
    duration: 28,
    category: 'maintenance'
  },
  'peptide maintenance - 4 week refill': {
    type: 'maintenance_28day',
    duration: 28,
    category: 'maintenance'
  },
  'peptide maintenance – 4 week refill': {
    type: 'maintenance_28day',
    duration: 28,
    category: 'maintenance'
  },
  
  // In-Clinic Injection
  'peptide injection - in-clinic': {
    type: 'injection_clinic',
    duration: 1,
    category: 'clinic'
  },
  'peptide injection – in-clinic': {
    type: 'injection_clinic',
    duration: 1,
    category: 'clinic'
  },

  // === LEGACY SKUs (for backwards compatibility) ===
  'peptide recovery protocol - 10-day intensive': {
    type: 'jumpstart_10day',
    duration: 10,
    category: 'jumpstart'
  },
  'peptide recovery protocol – 10-day intensive': {
    type: 'jumpstart_10day',
    duration: 10,
    category: 'jumpstart'
  },
  'peptide recovery protocol - 30-day program': {
    type: 'month_30day',
    duration: 30,
    category: 'month'
  },
  'peptide recovery protocol – 30-day program': {
    type: 'month_30day',
    duration: 30,
    category: 'month'
  },
  'peptide metabolic protocol - 30-day program': {
    type: 'month_30day',
    duration: 30,
    category: 'month'
  },
  'peptide metabolic protocol – 30-day program': {
    type: 'month_30day',
    duration: 30,
    category: 'month'
  },
  'peptide longevity protocol - 30-day program': {
    type: 'month_30day',
    duration: 30,
    category: 'month'
  },
  'peptide longevity protocol – 30-day program': {
    type: 'month_30day',
    duration: 30,
    category: 'month'
  }
};

// Helper to normalize product names for matching
function normalizeProductName(name) {
  return name
    .toLowerCase()
    .replace(/–/g, '-')  // en-dash to hyphen
    .replace(/—/g, '-')  // em-dash to hyphen
    .trim();
}

// Pattern matching for legacy/variant product names
const PROGRAM_PATTERNS = [
  // Jumpstart / 10-day patterns
  { pattern: /10.?day.*(?:bpc|tb|recovery|repair|wolverine|kpv|mgf|jumpstart)/i, type: 'jumpstart_10day', duration: 10 },
  { pattern: /(?:bpc|tb|recovery|repair|wolverine|kpv|mgf|jumpstart).*10.?day/i, type: 'jumpstart_10day', duration: 10 },
  
  // Month Program / 30-day patterns (duration adjusted based on frequency when edited)
  { pattern: /30.?day.*(?:bpc|tb|recovery|repair|kpv|metabolic|aod|mots|longevity|glow|aesthetic|month)/i, type: 'month_30day', duration: 30 },
  { pattern: /(?:bpc|tb|recovery|repair|kpv|metabolic|aod|mots|longevity|glow|aesthetic|month).*30.?day/i, type: 'month_30day', duration: 30 },
  { pattern: /peptide\s*month/i, type: 'month_30day', duration: 30 },
  
  // Maintenance / Refill patterns
  { pattern: /maintenance|refill|4.?week|28.?day|follow.?on/i, type: 'maintenance_28day', duration: 28 },
  
  // In-clinic patterns
  { pattern: /(?:injection|in.?clinic|single.*(?:injection|shot))/i, type: 'injection_clinic', duration: 1 },
  { pattern: /(?:bpc|tb).*injection$/i, type: 'injection_clinic', duration: 1 }
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Parse product name to determine protocol type and duration
 */
function parseProductToProtocol(productName) {
  if (!productName) return null;
  
  // Normalize and check exact matches first
  const normalized = normalizeProductName(productName);
  if (PROGRAM_MAPPING[normalized]) {
    return {
      ...PROGRAM_MAPPING[normalized],
      programName: productName
    };
  }
  
  // Try pattern matching
  for (const { pattern, type, duration } of PROGRAM_PATTERNS) {
    if (pattern.test(productName)) {
      return {
        type,
        duration,
        programName: productName,
        category: type.split('_')[0]
      };
    }
  }
  
  // Default: try to extract days from product name
  const daysMatch = productName.match(/(\d+).?day/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    return {
      type: days <= 10 ? 'recovery_10day' : 'recovery_30day',
      duration: days,
      programName: productName,
      category: 'recovery'
    };
  }
  
  // Can't determine - return null
  return null;
}

/**
 * Extract peptide tools from product name
 */
function extractPeptideTools(productName) {
  const peptides = {
    primary: null,
    secondary: null
  };
  
  const peptidePatterns = [
    { pattern: /bpc.?157/i, name: 'BPC-157' },
    { pattern: /tb.?500|thymosin\s*beta/i, name: 'TB-500' },
    { pattern: /wolverine/i, name: 'Wolverine Blend (BPC/TB)' },
    { pattern: /kpv/i, name: 'KPV' },
    { pattern: /mgf/i, name: 'MGF (IGF-1Ec)' },
    { pattern: /aod.?9604/i, name: 'AOD 9604' },
    { pattern: /mots.?c/i, name: 'MOTS-c' },
    { pattern: /epitalon|epithalon/i, name: 'Epithalon (Epitalon)' },
    { pattern: /ta.?1|thymosin\s*alpha/i, name: 'Thymosin Alpha-1 (TA-1)' },
    { pattern: /ghk.?cu/i, name: 'GHK-Cu' },
    { pattern: /tesa.*ipa|ipa.*tesa/i, name: 'Tesamorelin/Ipamorelin' },
    { pattern: /tesamorelin/i, name: 'Tesamorelin' },
    { pattern: /ipamorelin/i, name: 'Ipamorelin' },
    { pattern: /3x\s*blend/i, name: '3X Blend (Tesa/MGF/Ipa)' },
    { pattern: /glow/i, name: 'GLOW Blend' }
  ];
  
  const found = [];
  for (const { pattern, name } of peptidePatterns) {
    if (pattern.test(productName)) {
      found.push(name);
    }
  }
  
  if (found.length > 0) {
    peptides.primary = found[0];
    if (found.length > 1) {
      peptides.secondary = found[1];
    }
  }
  
  return peptides;
}

/**
 * Suggest primary goal based on peptide name
 * Maps to the 10 outcome-focused goals
 */
function suggestGoalFromPeptide(peptideName) {
  if (!peptideName) return 'specialty';
  
  const name = peptideName.toLowerCase();
  
  // Recovery / Pain / Tissue Repair
  if (name.includes('bpc') || name.includes('tb-500') || name.includes('tb500') || 
      name.includes('wolverine') || name.includes('mgf')) {
    return 'recovery';
  }
  
  // Weight & Metabolic
  if (name.includes('glp-1') || name.includes('semaglutide') || name.includes('tirzepatide') ||
      name.includes('retatrutide') || name.includes('survodutide') || name.includes('cagrilintide') ||
      name.includes('aod') || name.includes('mots') || name.includes('5-amino') ||
      name.includes('tesofensine')) {
    return 'weight_metabolic';
  }
  
  // Brain, Focus & Mood
  if (name.includes('dihexa') || name.includes('semax') || name.includes('selank') ||
      name.includes('nad') || name.includes('bdnf') || name.includes('brain')) {
    return 'brain_focus';
  }
  
  // Longevity & Immune Protection
  if (name.includes('epithalon') || name.includes('epitalon') || name.includes('foxo4') ||
      name.includes('ss-31') || name.includes('thymosin alpha') || name.includes('ta-1') ||
      name.includes('ll-37') || name.includes('thymulin') || name.includes('thymagen') ||
      name.includes('cardiogen')) {
    return 'longevity_immune';
  }
  
  // Skin, Hair & Aesthetic
  if (name.includes('ghk') || name.includes('glow') || name.includes('klow') ||
      name.includes('melanotan') || name.includes('mt-ii') || name.includes('kpv')) {
    return 'skin_aesthetic';
  }
  
  // Sexual Health
  if (name.includes('pt-141') || name.includes('oxytocin') || name.includes('kisspeptin')) {
    return 'sexual_health';
  }
  
  // Sleep & Stress
  if (name.includes('dsip')) {
    return 'sleep_stress';
  }
  
  // HRT / Hormone Therapy
  if (name.includes('testosterone') || name.includes('estradiol') || name.includes('estrogen') ||
      name.includes('progesterone') || name.includes('anastrozole') || name.includes('enclomiphene') ||
      name.includes('dhea') || name.includes('pregnenolone') || name.includes('gonadorelin') ||
      name.includes('hcg')) {
    return 'hrt';
  }
  
  // IV Therapy
  if (name.includes('iv') || name.includes('myers') || name.includes('glutathione') ||
      name.includes('vitamin c') || name.includes('hydration') || name.includes('immune boost')) {
    return 'iv_therapy';
  }
  
  // Default
  return 'specialty';
}

/**
 * Categorize purchase by product name
 */
function categorizePurchase(productName) {
  if (!productName) return 'Other';
  const name = productName.toLowerCase();
  
  // Peptides
  if (/peptide|bpc|tb-?500|ghk|epitalon|tesa|ipa|mots|thymosin|ta-1|kisspeptin|pt-141|melanotan|sermorelin|cjc|ipamorelin|tesamorelin|wolverine/i.test(name)) {
    return 'Peptide';
  }
  
  // IV Therapy
  if (/iv|infusion|hydration|myers|blu|methylene blue|vitamin c|glutathione iv|nad\+ iv|exosome|glow iv|detox iv|energy iv|recovery iv|hangover/i.test(name)) {
    return 'IV Therapy';
  }
  
  // Weight Loss
  if (/weight loss|tirzepatide|semaglutide|retatrutide|weight-loss/i.test(name)) {
    return 'Weight Loss';
  }
  
  // HRT
  if (/hrt|trt|testosterone|hormone|pellet/i.test(name)) {
    return 'HRT';
  }
  
  // Labs
  if (/lab|blood draw|blood test|panel|g6pd/i.test(name)) {
    return 'Labs';
  }
  
  // Injections (non-peptide)
  if (/nad\+ injection|nad injection|b12|b-12|torodol|injection therapy|vitamin d/i.test(name)) {
    return 'Injection';
  }
  
  // Hyperbaric
  if (/hyperbaric/i.test(name)) {
    return 'Hyperbaric';
  }
  
  // Red Light
  if (/red light/i.test(name)) {
    return 'Red Light';
  }
  
  // Consultation
  if (/consult|review|follow up|assessment|encounter/i.test(name)) {
    return 'Consultation';
  }
  
  return 'Other';
}

/**
 * Normalize item name for consistent storage
 */
function normalizeItemName(productName, category) {
  if (!productName) return 'Unknown';
  const name = productName.toLowerCase();
  
  if (category === 'Peptide') {
    if (/wolverine|bpc.*tb|tb.*bpc/i.test(name)) {
      if (/30/i.test(name)) return 'Wolverine Blend (BPC/TB) - 30 Day';
      if (/10/i.test(name)) return 'Wolverine Blend (BPC/TB) - 10 Day';
      return 'Wolverine Blend (BPC/TB)';
    }
    if (/ghk/i.test(name)) return 'GHK-Cu Protocol';
    if (/epitalon/i.test(name)) return 'Epitalon Protocol';
    if (/tesa.*ipa|ipa.*tesa/i.test(name)) return 'Tesamorelin/Ipamorelin Blend';
    if (/mots/i.test(name)) return 'MOTS-C Protocol';
    if (/30.*day|30-day/i.test(name)) return 'Peptide Protocol - 30 Day';
    if (/10.*day|10-day/i.test(name)) return 'Peptide Protocol - 10 Day';
    if (/14.*day|14-day/i.test(name)) return 'Peptide Protocol - 14 Day';
    if (/vial/i.test(name)) return 'Peptide Vial';
    if (/injection/i.test(name)) return 'Peptide Injection (In-Clinic)';
    return 'Peptide Therapy';
  }
  
  if (category === 'IV Therapy') {
    if (/methylene blue.*vitamin c|mb.*vitamin c/i.test(name)) return 'MB + Vitamin C + Magnesium IV';
    if (/methylene blue.*sublingual/i.test(name)) return 'Methylene Blue Sublingual';
    if (/range iv|build your own|choose your own/i.test(name)) return 'Range IV (Build Your Own)';
    if (/myers|immune/i.test(name)) return 'Immune Boost IV (Myers)';
    if (/vitamin c|high.?dose/i.test(name)) return 'High-Dose Vitamin C IV';
    if (/nad\+ iv|nad iv/i.test(name)) return 'NAD+ IV';
    if (/glutathione/i.test(name)) return 'Glutathione IV';
    if (/exosome/i.test(name)) return 'Exosome IV Therapy';
    if (/blu/i.test(name)) return 'The Blu IV';
    if (/hydration|basic/i.test(name)) return 'Basic Hydration IV';
    return 'IV Therapy';
  }
  
  if (category === 'Weight Loss') {
    if (/program|membership/i.test(name)) return 'Weight Loss Program (Monthly)';
    return 'Weight Loss Injection';
  }
  
  if (category === 'HRT') {
    if (/female/i.test(name)) return 'Female HRT Membership';
    if (/pellet/i.test(name)) return 'Testosterone Pellet';
    return 'Male HRT Membership';
  }
  
  if (category === 'Labs') {
    if (/elite.*male/i.test(name)) return 'Elite Lab Panel - Male';
    if (/elite.*female/i.test(name)) return 'Elite Lab Panel - Female';
    if (/elite/i.test(name)) return 'Elite Lab Panel';
    if (/g6pd/i.test(name)) return 'G6PD Blood Test';
    if (/follow/i.test(name)) return 'Follow Up Blood Draw';
    return 'New Patient Blood Draw';
  }
  
  if (category === 'Injection') {
    if (/nad/i.test(name)) {
      const match = name.match(/(\d+)\s*mg/);
      if (match) return `NAD+ Injection (${match[1]}mg)`;
      if (/12.?pack/i.test(name)) return 'NAD+ 12-Pack';
      if (/10.?pack/i.test(name)) return 'NAD+ 10-Pack';
      return 'NAD+ Injection';
    }
    if (/b-?12/i.test(name)) return 'B12 Injection';
    if (/torodol/i.test(name)) return 'Toradol Injection';
    return 'Injection Therapy';
  }
  
  if (category === 'Hyperbaric') {
    if (/package|10/i.test(name)) return 'Hyperbaric - 10 Pack';
    return 'Hyperbaric - Single';
  }
  
  if (category === 'Red Light') {
    if (/20/i.test(name)) return 'Red Light - 20 Pack';
    if (/10/i.test(name)) return 'Red Light - 10 Pack';
    if (/5/i.test(name)) return 'Red Light - 5 Pack';
    return 'Red Light - Single';
  }
  
  if (category === 'Consultation') {
    if (/review/i.test(name)) return 'Lab Review Consultation';
    if (/follow/i.test(name)) return 'Follow Up Consultation';
    return 'Initial Consultation';
  }
  
  return productName.substring(0, 60);
}

/**
 * Update GHL contact with protocol info
 */
async function updateGHLContact(contactId, protocolData) {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        customFields: [
          { key: 'current_protocol', value: protocolData.programName },
          { key: 'protocol_status', value: protocolData.status },
          { key: 'protocol_start_date', value: protocolData.startDate },
          { key: 'protocol_end_date', value: protocolData.endDate },
          { key: 'protocol_days_remaining', value: protocolData.daysRemaining?.toString() },
          { key: 'primary_peptide', value: protocolData.primaryPeptide },
          { key: 'secondary_peptide', value: protocolData.secondaryPeptide },
          { key: 'protocol_dashboard_link', value: protocolData.dashboardLink }
        ].filter(f => f.value) // Remove empty fields
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('GHL update failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('GHL update error:', error);
    return false;
  }
}

/**
 * Add note to GHL contact
 */
async function addGHLNote(contactId, noteBody) {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({ body: noteBody })
    });
    
    return response.ok;
  } catch (error) {
    console.error('GHL note error:', error);
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

  try {
    const payload = req.body;
    
    console.log('📥 Received webhook:', JSON.stringify(payload, null, 2));

    // Handle different webhook types
    const webhookType = payload.type || payload.event;
    
    // =========================================
    // PAYMENT RECEIVED WEBHOOK
    // =========================================
    if (webhookType === 'PaymentReceived' || webhookType === 'payment.received' || payload.payment || payload.invoice || payload.amount) {
      const payment = payload.payment || payload.invoice || payload;
      const contact = payload.contact || payload.payment?.customer || payload;
      
      // Extract data - try multiple possible field locations
      const contactId = contact.id || contact.contact_id || contact.contactId || 
                       payload.contact_id || payload.contactId || payload.id;
      
      // Get product name from line_items (where GHL actually puts it)
      const lineItems = payment.line_items || payment.lineItems || [];
      const firstLineItem = lineItems[0] || {};
      
      // Try many possible locations for product name
      const productName = firstLineItem.title ||
                         firstLineItem.name ||
                         firstLineItem.product_name ||
                         payment.productName || 
                         payment.product_name ||
                         payment.product?.name ||
                         payment.name ||
                         payment.title ||
                         payload.productName ||
                         payload.product_name ||
                         payload.product?.name ||
                         payload.name ||
                         payload.title ||
                         payload.invoice?.name ||
                         payload.invoice?.title ||
                         '';
      
      const rawAmount = payment.total_amount || payment.amount || payment.total || payload.amount || payload.total || 0;
      
      // Determine if amount is in cents or dollars
      // If amount > 1000, assume cents (e.g., 45000 = $450.00)
      // If amount <= 1000, assume dollars (e.g., 450 = $450.00)
      // Also check if it's a string with decimal point
      let amount;
      if (typeof rawAmount === 'string' && rawAmount.includes('.')) {
        // Already in dollars with decimal (e.g., "450.00")
        amount = parseFloat(rawAmount);
      } else if (rawAmount > 1000) {
        // Likely cents, convert to dollars
        amount = rawAmount / 100;
      } else {
        // Already in dollars
        amount = parseFloat(rawAmount);
      }
      const paymentId = payment.transaction_id || payment.id || payment.payment_id || payload.payment_id || payload.id;
      
      console.log('💰 Payment data extracted:', {
        contactId,
        productName,
        amount,
        paymentId
      });
      
      // Get contact details from payload
      const customer = payment.customer || {};
      let contactName = customer.name || customer.full_name || 
                       `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
                       payload.full_name || payload.first_name || 'Unknown';
      let contactEmail = customer.email || payload.email;
      let contactPhone = customer.phone || payload.phone;
      
      console.log('👤 Contact extracted:', { contactId, contactName, contactEmail });
      
      // =========================================
      // CREATE PURCHASE RECORD (ALL PAYMENTS)
      // =========================================
      const purchaseCategory = categorizePurchase(productName);
      const normalizedItem = normalizeItemName(productName, purchaseCategory);
      
      try {
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            ghl_contact_id: contactId || null,
            patient_name: contactName || 'Unknown',
            patient_email: contactEmail || null,
            patient_phone: contactPhone || null,
            purchase_date: new Date().toISOString().split('T')[0],
            category: purchaseCategory,
            item_name: normalizedItem,
            quantity: 1,
            amount: amount,
            invoice_number: paymentId || null,
            source: 'GoHighLevel'
          })
          .select()
          .single();
        
        if (purchaseError) {
          console.error('⚠️ Purchase insert error:', purchaseError);
        } else {
          console.log('✅ Purchase recorded:', purchase.id, '-', normalizedItem);
        }
      } catch (purchaseErr) {
        console.error('⚠️ Purchase creation failed:', purchaseErr);
        // Continue - don't fail the webhook for purchase logging
      }
      
      // Parse product to protocol
      const protocolInfo = parseProductToProtocol(productName);
      
      if (!protocolInfo) {
        // Not a protocol product - just log the payment
        console.log(`ℹ️ Non-protocol product: ${productName}`);
        
        // Still add a note to GHL
        if (contactId) {
          await addGHLNote(contactId, `💳 Payment received: $${amount.toFixed(2)} for ${productName}`);
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Payment logged (non-protocol product)',
          productName 
        });
      }
      
      // Extract peptide tools
      const peptideTools = extractPeptideTools(productName);
      
      // Suggest goal based on peptide
      const suggestedGoal = suggestGoalFromPeptide(peptideTools.primary);
      
      // Calculate dates
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + protocolInfo.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Create protocol record in Supabase
      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .insert({
          ghl_contact_id: contactId,
          patient_name: contactName || 'Unknown',
          patient_email: contactEmail,
          patient_phone: contactPhone,
          program_type: protocolInfo.type,
          program_name: protocolInfo.programName,
          duration_days: protocolInfo.duration,
          goal: suggestedGoal,
          primary_peptide: peptideTools.primary,
          secondary_peptide: peptideTools.secondary,
          peptide_route: 'SC', // Default to subcutaneous
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          ghl_payment_id: paymentId,
          amount_paid: amount, // Already in dollars
          payment_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (protocolError) {
        console.error('Supabase insert error:', protocolError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create protocol record',
          details: protocolError.message 
        });
      }
      
      console.log('✅ Protocol created:', protocol.id);
      
      // Update GHL contact with protocol info
      if (contactId) {
        const dashboardUrl = `https://rangemedical-system-2.vercel.app/admin/protocols?contact=${contactId}`;
        
        await updateGHLContact(contactId, {
          programName: protocolInfo.programName,
          status: 'Active',
          startDate,
          endDate,
          daysRemaining: protocolInfo.duration,
          primaryPeptide: peptideTools.primary,
          secondaryPeptide: peptideTools.secondary,
          dashboardLink: dashboardUrl
        });
        
        // Add note
        const noteBody = `🧬 PROTOCOL STARTED
━━━━━━━━━━━━━━━━━━━━━
Program: ${protocolInfo.programName}
Duration: ${protocolInfo.duration} days
Start: ${startDate}
End: ${endDate}
${peptideTools.primary ? `Primary Tool: ${peptideTools.primary}` : ''}
${peptideTools.secondary ? `Secondary Tool: ${peptideTools.secondary}` : ''}
Amount: $${amount.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━`;
        
        await addGHLNote(contactId, noteBody);
      }
      
      // Update sync timestamp
      await supabase
        .from('protocols')
        .update({ synced_to_ghl_at: new Date().toISOString() })
        .eq('id', protocol.id);
      
      return res.status(200).json({
        success: true,
        message: 'Protocol created successfully',
        protocol: {
          id: protocol.id,
          programType: protocolInfo.type,
          duration: protocolInfo.duration,
          startDate,
          endDate,
          peptides: peptideTools
        }
      });
    }
    
    // =========================================
    // UNKNOWN WEBHOOK TYPE
    // =========================================
    console.log(`ℹ️ Unhandled webhook type: ${webhookType}`);
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook received (no action taken)',
      type: webhookType 
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// =====================================================
// EXPORT CONFIG
// =====================================================
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
