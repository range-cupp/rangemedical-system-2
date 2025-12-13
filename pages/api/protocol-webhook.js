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
const PROGRAM_MAPPING = {
  // Exact matches (canonical SKUs) - normalized to lowercase, hyphens standardized
  'peptide recovery protocol - 10-day intensive': {
    type: 'recovery_10day',
    duration: 10,
    category: 'recovery'
  },
  'peptide recovery protocol – 10-day intensive': {
    type: 'recovery_10day',
    duration: 10,
    category: 'recovery'
  },
  'peptide recovery protocol - 30-day program': {
    type: 'recovery_30day',
    duration: 30,
    category: 'recovery'
  },
  'peptide recovery protocol – 30-day program': {
    type: 'recovery_30day',
    duration: 30,
    category: 'recovery'
  },
  'peptide metabolic protocol - 30-day program': {
    type: 'metabolic_30day',
    duration: 30,
    category: 'metabolic'
  },
  'peptide metabolic protocol – 30-day program': {
    type: 'metabolic_30day',
    duration: 30,
    category: 'metabolic'
  },
  'peptide longevity protocol - 30-day program': {
    type: 'longevity_30day',
    duration: 30,
    category: 'longevity'
  },
  'peptide longevity protocol – 30-day program': {
    type: 'longevity_30day',
    duration: 30,
    category: 'longevity'
  },
  'peptide injection - in-clinic': {
    type: 'injection_clinic',
    duration: 1,
    category: 'clinic'
  },
  'peptide injection – in-clinic': {
    type: 'injection_clinic',
    duration: 1,
    category: 'clinic'
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
  // Recovery patterns
  { pattern: /10.?day.*(?:bpc|tb|recovery|repair|wolverine|kpv|mgf)/i, type: 'recovery_10day', duration: 10 },
  { pattern: /(?:bpc|tb|recovery|repair|wolverine|kpv|mgf).*10.?day/i, type: 'recovery_10day', duration: 10 },
  { pattern: /30.?day.*(?:bpc|tb|recovery|repair|kpv)/i, type: 'recovery_30day', duration: 30 },
  { pattern: /(?:bpc|tb|recovery|repair|kpv).*30.?day/i, type: 'recovery_30day', duration: 30 },
  
  // Metabolic patterns
  { pattern: /30.?day.*(?:aod|mots|metabolic|weight|skinny|tesa.*ipa)/i, type: 'metabolic_30day', duration: 30 },
  { pattern: /(?:aod|mots|metabolic|weight|skinny).*30.?day/i, type: 'metabolic_30day', duration: 30 },
  { pattern: /20.?day.*mots/i, type: 'metabolic_30day', duration: 20 },
  
  // Longevity patterns
  { pattern: /30.?day.*(?:epitalon|ta-?1|ghk|longevity|glow)/i, type: 'longevity_30day', duration: 30 },
  { pattern: /(?:epitalon|ta-?1|ghk|longevity).*30.?day/i, type: 'longevity_30day', duration: 30 },
  { pattern: /10.?day.*epitalon/i, type: 'longevity_30day', duration: 10 },
  
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
          { key: 'secondary_peptide', value: protocolData.secondaryPeptide }
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
      
      const amount = payment.total_amount || payment.amount || payment.total || payload.amount || payload.total || 0;
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
      
      // Parse product to protocol
      const protocolInfo = parseProductToProtocol(productName);
      
      if (!protocolInfo) {
        // Not a protocol product - just log the payment
        console.log(`ℹ️ Non-protocol product: ${productName}`);
        
        // Still add a note to GHL
        if (contactId) {
          await addGHLNote(contactId, `💳 Payment received: $${(amount / 100).toFixed(2)} for ${productName}`);
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Payment logged (non-protocol product)',
          productName 
        });
      }
      
      // Extract peptide tools
      const peptideTools = extractPeptideTools(productName);
      
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
          primary_peptide: peptideTools.primary,
          secondary_peptide: peptideTools.secondary,
          peptide_route: 'SC', // Default to subcutaneous
          start_date: startDate,
          status: 'active',
          ghl_payment_id: paymentId,
          amount_paid: amount / 100, // Convert cents to dollars
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
        await updateGHLContact(contactId, {
          programName: protocolInfo.programName,
          status: 'Active',
          startDate,
          endDate,
          daysRemaining: protocolInfo.duration,
          primaryPeptide: peptideTools.primary,
          secondaryPeptide: peptideTools.secondary
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
Amount: $${(amount / 100).toFixed(2)}
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
