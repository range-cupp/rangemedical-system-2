// /pages/api/admin/patient.js
// Patient Profile API - Fetches all data for a single patient
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, ghl_contact_id, email, phone } = req.query;

  try {
    let patient = null;
    let patientId = id;

    // =====================================================
    // FIND PATIENT
    // =====================================================
    
    if (id) {
      // Direct patient ID lookup
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        patient = data;
        patientId = data.id;
      }
    }
    
    // If no patient found by ID, try email/phone
    if (!patient && (email || phone)) {
      let query = supabase.from('patients').select('*');
      
      if (email) {
        query = query.ilike('email', email);
      } else if (phone) {
        // Clean phone for matching
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        query = query.or(`phone.ilike.%${cleanPhone}%`);
      }
      
      const { data, error } = await query.limit(1).single();
      
      if (!error && data) {
        patient = data;
        patientId = data.id;
      }
    }

    // If still no patient, create a shell from protocols/purchases data
    if (!patient && ghl_contact_id) {
      // Try to find from protocols
      const { data: protocol } = await supabase
        .from('protocols')
        .select('patient_name, patient_email, patient_phone')
        .eq('ghl_contact_id', ghl_contact_id)
        .limit(1)
        .single();
      
      if (protocol) {
        patient = {
          id: null,
          name: protocol.patient_name,
          email: protocol.patient_email,
          phone: protocol.patient_phone,
          ghl_contact_id: ghl_contact_id
        };
      }
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // =====================================================
    // FETCH ALL RELATED DATA
    // =====================================================

    // Intakes
    let intakes = [];
    if (patientId) {
      const { data } = await supabase
        .from('intakes')
        .select('*')
        .eq('patient_id', patientId)
        .order('submitted_at', { ascending: false });
      intakes = data || [];
    }

    // Consents
    let consents = [];
    if (patientId) {
      const { data } = await supabase
        .from('consents')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false });
      consents = data || [];
    }

    // Labs
    let labs = [];
    if (patientId) {
      const { data } = await supabase
        .from('labs')
        .select('*')
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false });
      labs = data || [];
    }

    // Medical Documents
    let documents = [];
    if (patientId) {
      const { data } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      documents = data || [];
    }

    // Protocols - match by ghl_contact_id OR email OR phone
    let protocols = [];
    const patientEmail = patient.email?.toLowerCase();
    const patientPhone = patient.phone?.replace(/\D/g, '').slice(-10);
    
    let protocolQuery = supabase.from('protocols').select('*');
    
    if (ghl_contact_id) {
      protocolQuery = protocolQuery.eq('ghl_contact_id', ghl_contact_id);
    } else if (patientEmail) {
      protocolQuery = protocolQuery.ilike('patient_email', patientEmail);
    } else if (patientPhone) {
      protocolQuery = protocolQuery.or(`patient_phone.ilike.%${patientPhone}%`);
    }
    
    const { data: protocolData } = await protocolQuery.order('start_date', { ascending: false });
    protocols = protocolData || [];

    // If we found protocols but didn't have ghl_contact_id, grab it
    if (protocols.length > 0 && !patient.ghl_contact_id) {
      patient.ghl_contact_id = protocols[0].ghl_contact_id;
    }

    // Get injection logs for protocols
    const protocolIds = protocols.map(p => p.id);
    let injectionLogs = [];
    if (protocolIds.length > 0) {
      const { data } = await supabase
        .from('injection_logs')
        .select('*')
        .in('protocol_id', protocolIds);
      injectionLogs = data || [];
    }

    // Add injection stats to protocols
    protocols = protocols.map(p => {
      const logs = injectionLogs.filter(l => l.protocol_id === p.id);
      return {
        ...p,
        injections_completed: logs.length
      };
    });

    // Purchases - match by ghl_contact_id OR email OR phone
    let purchases = [];
    let purchaseQuery = supabase.from('purchases').select('*');
    
    if (patient.ghl_contact_id) {
      purchaseQuery = purchaseQuery.eq('ghl_contact_id', patient.ghl_contact_id);
    } else if (patientEmail) {
      purchaseQuery = purchaseQuery.ilike('patient_email', patientEmail);
    } else if (patientPhone) {
      purchaseQuery = purchaseQuery.or(`patient_phone.ilike.%${patientPhone}%`);
    }
    
    const { data: purchaseData } = await purchaseQuery.order('purchase_date', { ascending: false });
    purchases = purchaseData || [];

    // =====================================================
    // CALCULATE SUMMARY STATS
    // =====================================================

    const stats = {
      totalSpent: purchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      totalPurchases: purchases.length,
      activeProtocols: protocols.filter(p => p.status === 'active').length,
      completedProtocols: protocols.filter(p => p.status === 'completed').length,
      totalInjections: injectionLogs.length,
      labsCount: labs.length,
      consentsCount: consents.length,
      hasIntake: intakes.length > 0,
      firstVisit: purchases.length > 0 ? purchases[purchases.length - 1].purchase_date : null,
      lastVisit: purchases.length > 0 ? purchases[0].purchase_date : null
    };

    // =====================================================
    // RETURN COMPLETE PROFILE
    // =====================================================

    return res.status(200).json({
      patient: {
        ...patient,
        ghl_contact_id: patient.ghl_contact_id || ghl_contact_id
      },
      stats,
      intakes,
      consents,
      labs,
      documents,
      protocols,
      purchases
    });

  } catch (error) {
    console.error('Patient profile error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
