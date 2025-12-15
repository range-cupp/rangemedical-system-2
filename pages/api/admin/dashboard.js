// =====================================================
// STAFF DASHBOARD API
// /pages/api/admin/dashboard.js
// Returns needs attention items + all patients
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get needs attention items
    const needsAttention = await getNeedsAttention();
    
    // Get all patients with summary
    const patients = await getPatientsSummary();
    
    // Get summary counts
    const summary = {
      totalPatients: patients.length,
      needsAttentionCount: needsAttention.length,
      activeHRT: patients.filter(p => p.hrt_status === 'active').length,
      activeWeightLoss: patients.filter(p => p.weight_loss_status === 'active').length
    };

    return res.status(200).json({
      success: true,
      data: {
        needsAttention,
        patients,
        summary
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// =====================================================
// Get items needing attention
// =====================================================
async function getNeedsAttention() {
  const items = [];
  const today = new Date();
  
  // 1. HRT IVs expiring in 7 days
  const { data: hrtPeriods } = await supabase
    .from('hrt_monthly_periods')
    .select(`
      *,
      hrt_memberships!inner (
        patient_name,
        patient_email,
        patient_phone,
        ghl_contact_id,
        status
      )
    `)
    .eq('iv_used', false)
    .eq('hrt_memberships.status', 'active')
    .gte('period_end', today.toISOString().split('T')[0]);

  for (const period of hrtPeriods || []) {
    const periodEnd = new Date(period.period_end);
    const daysLeft = Math.ceil((periodEnd - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7) {
      items.push({
        attention_type: 'hrt_iv',
        attention_label: 'IV Expiring',
        patient_name: period.hrt_memberships.patient_name,
        patient_email: period.hrt_memberships.patient_email,
        patient_phone: period.hrt_memberships.patient_phone,
        ghl_contact_id: period.hrt_memberships.ghl_contact_id,
        detail: period.period_label,
        days_remaining: daysLeft,
        due_date: period.period_end
      });
    }
  }

  // 2. Labs overdue (HRT)
  const { data: hrtLabs } = await supabase
    .from('hrt_memberships')
    .select('*')
    .eq('status', 'active')
    .lt('next_lab_due', today.toISOString().split('T')[0]);

  for (const hrt of hrtLabs || []) {
    const labDue = new Date(hrt.next_lab_due);
    const daysOverdue = Math.ceil((today - labDue) / (1000 * 60 * 60 * 24));
    
    items.push({
      attention_type: 'lab',
      attention_label: 'Lab Overdue',
      patient_name: hrt.patient_name,
      patient_email: hrt.patient_email,
      patient_phone: hrt.patient_phone,
      ghl_contact_id: hrt.ghl_contact_id,
      detail: `HRT ${hrt.next_lab_type} labs`,
      days_remaining: -daysOverdue,
      due_date: hrt.next_lab_due
    });
  }

  // 3. Session packs running low (<=2 remaining)
  const { data: lowPacks } = await supabase
    .from('session_packages')
    .select(`
      *,
      patients (
        full_name,
        email,
        phone,
        ghl_contact_id
      )
    `)
    .eq('status', 'active')
    .lte('sessions_remaining', 2)
    .gt('sessions_remaining', 0);

  for (const pack of lowPacks || []) {
    if (pack.patients) {
      items.push({
        attention_type: pack.service_type,
        attention_label: 'Sessions Low',
        patient_name: pack.patients.full_name,
        patient_email: pack.patients.email,
        patient_phone: pack.patients.phone,
        ghl_contact_id: pack.patients.ghl_contact_id,
        detail: `${pack.package_name}: ${pack.sessions_remaining} left`,
        days_remaining: pack.sessions_remaining,
        due_date: null
      });
    }
  }

  // 4. Protocols ending soon
  const { data: protocols } = await supabase
    .from('protocols')
    .select('*')
    .eq('status', 'active')
    .not('end_date', 'is', null);

  for (const protocol of protocols || []) {
    const endDate = new Date(protocol.end_date);
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7 && daysLeft >= 0) {
      items.push({
        attention_type: 'protocol',
        attention_label: 'Protocol Ending',
        patient_name: protocol.patient_name,
        patient_email: protocol.patient_email,
        patient_phone: protocol.patient_phone,
        ghl_contact_id: protocol.ghl_contact_id,
        detail: protocol.protocol_name,
        days_remaining: daysLeft,
        due_date: protocol.end_date
      });
    }
  }

  // Sort by urgency (most urgent first)
  items.sort((a, b) => a.days_remaining - b.days_remaining);

  return items;
}

// =====================================================
// Get all patients with summary info
// =====================================================
async function getPatientsSummary() {
  // Get patients
  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .eq('status', 'active')
    .order('full_name');

  if (error) throw error;

  // Get HRT memberships
  const { data: hrtMemberships } = await supabase
    .from('hrt_memberships')
    .select(`
      patient_id,
      ghl_contact_id,
      status,
      next_lab_due
    `)
    .eq('status', 'active');

  // Get current periods for HRT
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: periods } = await supabase
    .from('hrt_monthly_periods')
    .select('*')
    .gte('period_start', monthStart)
    .lte('period_start', monthEnd);

  // Get weight loss programs
  const { data: weightLoss } = await supabase
    .from('weight_loss_programs')
    .select('patient_id, ghl_contact_id, status, current_weight, medication, current_dose')
    .eq('status', 'active');

  // Get protocol counts
  const { data: protocolCounts } = await supabase
    .from('protocols')
    .select('patient_id, ghl_contact_id')
    .eq('status', 'active');

  // Create lookup maps
  const hrtMap = new Map();
  for (const hrt of hrtMemberships || []) {
    hrtMap.set(hrt.ghl_contact_id, hrt);
  }

  const periodMap = new Map();
  for (const period of periods || []) {
    periodMap.set(period.membership_id, period);
  }

  const wlMap = new Map();
  for (const wl of weightLoss || []) {
    wlMap.set(wl.ghl_contact_id, wl);
  }

  const protocolMap = new Map();
  for (const p of protocolCounts || []) {
    const count = protocolMap.get(p.ghl_contact_id) || 0;
    protocolMap.set(p.ghl_contact_id, count + 1);
  }

  // Enrich patients
  return patients.map(patient => {
    const hrt = hrtMap.get(patient.ghl_contact_id);
    const period = hrt ? periodMap.get(hrt.id) : null;
    const wl = wlMap.get(patient.ghl_contact_id);
    const protocolCount = protocolMap.get(patient.ghl_contact_id) || 0;

    let ivDaysLeft = null;
    if (period && !period.iv_used) {
      const periodEnd = new Date(period.period_end);
      ivDaysLeft = Math.ceil((periodEnd - today) / (1000 * 60 * 60 * 24));
    }

    return {
      id: patient.id,
      ghl_contact_id: patient.ghl_contact_id,
      full_name: patient.full_name,
      email: patient.email,
      phone: patient.phone,
      
      hrt_status: hrt?.status || null,
      hrt_iv_used: period?.iv_used || false,
      hrt_iv_days_left: ivDaysLeft,
      
      weight_loss_status: wl?.status || null,
      current_weight: wl?.current_weight,
      wl_medication: wl?.medication,
      
      active_protocols: protocolCount
    };
  });
}
