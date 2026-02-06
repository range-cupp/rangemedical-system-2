// /pages/api/admin/command-center.js
// Unified API endpoint for Range Medical Command Center
// Returns all data needed for the dashboard in a single call

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // 1. Get all patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (patientsError) console.error('Patients error:', patientsError);

    // 2. Get all protocols with patient info
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        *,
        patients (
          id,
          name,
          first_name,
          last_name,
          email,
          phone,
          ghl_contact_id
        )
      `)
      .order('start_date', { ascending: false });

    if (protocolsError) console.error('Protocols error:', protocolsError);

    // 3. Get all purchases
    const { data: rawPurchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (purchasesError) console.error('Purchases error:', purchasesError);

    // Process purchases to extract actual payment amount from raw_payload
    const purchases = (rawPurchases || []).map(purchase => {
      let paymentAmount = purchase.amount_paid || purchase.amount;

      // Try to extract from raw_payload if amount_paid is null
      if (!purchase.amount_paid && purchase.raw_payload) {
        try {
          const payload = typeof purchase.raw_payload === 'string'
            ? JSON.parse(purchase.raw_payload)
            : purchase.raw_payload;

          // Check for payment.total_amount or payment.invoice.amount_paid
          if (payload?.payment?.total_amount) {
            paymentAmount = payload.payment.total_amount;
          } else if (payload?.payment?.invoice?.amount_paid) {
            paymentAmount = payload.payment.invoice.amount_paid;
          }
        } catch (e) {
          // Keep original amount if parsing fails
        }
      }

      return {
        ...purchase,
        display_amount: paymentAmount,
        list_price: purchase.list_price || purchase.amount,
      };
    });

    // 4. Get recent injection logs
    const { data: injectionLogs, error: injectionError } = await supabase
      .from('injection_logs')
      .select('*')
      .order('logged_at', { ascending: false })
      .limit(100);

    if (injectionError) console.error('Injection logs error:', injectionError);

    // 5. Get recent intakes
    const { data: intakes, error: intakesError } = await supabase
      .from('intakes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (intakesError) console.error('Intakes error:', intakesError);

    // 6. Get clinic appointments (for in-clinic tracking)
    const { data: clinicAppointments, error: clinicError } = await supabase
      .from('clinic_appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .limit(200);

    if (clinicError) console.error('Clinic appointments error:', clinicError);

    // 7. Get active alerts (session exhausted, overdraft, etc.)
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select(`
        *,
        patients (
          id,
          name,
          first_name,
          last_name,
          phone,
          ghl_contact_id
        )
      `)
      .eq('status', 'active')
      .order('triggered_at', { ascending: false })
      .limit(50);

    if (alertsError) console.error('Alerts error:', alertsError);

    // 8. Get leads from GHL
    let ghlLeads = [];
    try {
      const ghlRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=100&sortBy=date_added&sortOrder=desc`,
        {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
          }
        }
      );
      if (ghlRes.ok) {
        const ghlData = await ghlRes.json();
        ghlLeads = ghlData.contacts || [];
      }
    } catch (e) {
      console.error('GHL fetch error:', e);
    }

    // Process protocols for urgency
    const activeProtocols = (protocols || []).filter(p => p.status === 'active');
    const completedProtocols = (protocols || []).filter(p => p.status === 'completed');

    // Calculate protocol urgency
    const processedProtocols = activeProtocols.map(protocol => {
      const urgency = calculateProtocolUrgency(protocol, now);
      return { ...protocol, urgency };
    });

    // Sort by urgency (most urgent first)
    const urgencyOrder = { expired: 0, critical: 1, warning: 2, active: 3, fresh: 4 };
    processedProtocols.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    // Calculate stats
    const activeAlerts = (alerts || []).filter(a => a.status === 'active');
    const sessionAlerts = activeAlerts.filter(a =>
      a.alert_type === 'sessions_exhausted' || a.alert_type === 'sessions_exceeded'
    );

    const stats = {
      totalPatients: (patients || []).length,
      activeProtocols: activeProtocols.length,
      completedProtocols: completedProtocols.length,
      newLeads: (patients || []).filter(p =>
        new Date(p.created_at) >= sevenDaysAgo &&
        !activeProtocols.some(pr => pr.patient_id === p.id)
      ).length,
      needsProtocol: (purchases || []).filter(p => !p.protocol_created).length,
      endingSoon: processedProtocols.filter(p =>
        p.urgency === 'critical' || p.urgency === 'warning'
      ).length,
      noResponse: ghlLeads.filter(c =>
        (c.tags || []).some(t => t.toLowerCase().includes('no-response') || t.toLowerCase().includes('no response'))
      ).length,
      activeAlerts: activeAlerts.length,
      sessionAlerts: sessionAlerts.length,
    };

    // Protocol counts by category
    const protocolsByCategory = {};
    for (const p of activeProtocols) {
      const cat = p.program_type || 'other';
      protocolsByCategory[cat] = (protocolsByCategory[cat] || 0) + 1;
    }

    // Build leads list - merge GHL contacts with purchase info
    const patientGhlIds = new Set((patients || []).map(p => p.ghl_contact_id).filter(Boolean));
    const protocolPatientIds = new Set(activeProtocols.map(p => p.patient_id));

    const leads = ghlLeads
      .filter(c => {
        // Include contacts that don't have active protocols
        const matchingPatient = (patients || []).find(p => p.ghl_contact_id === c.id);
        if (matchingPatient && protocolPatientIds.has(matchingPatient.id)) return false;
        return true;
      })
      .map(c => ({
        id: c.id,
        name: c.contactName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown',
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        email: c.email,
        source: c.source || inferSource(c.tags),
        tags: c.tags || [],
        created_at: c.dateAdded,
        last_activity: c.dateUpdated || c.dateAdded,
        ghl_contact_id: c.id,
        status: inferLeadStatus(c),
      }));

    // Get purchases that need protocols assigned
    const purchasesNeedingProtocol = (purchases || []).filter(p => !p.protocol_created);

    // In-clinic visit tracking data
    const inClinicProtocols = activeProtocols.filter(p =>
      p.delivery_method === 'in_clinic' &&
      ['hrt', 'weight_loss'].includes(p.program_type)
    );

    const todayStr = now.toISOString().split('T')[0];

    const inClinicData = {
      overdue: inClinicProtocols.filter(p =>
        p.next_expected_date && p.next_expected_date < todayStr
      ).map(p => ({
        ...p,
        days_overdue: Math.floor((now - new Date(p.next_expected_date)) / (1000 * 60 * 60 * 24))
      })),
      dueToday: inClinicProtocols.filter(p =>
        p.next_expected_date === todayStr
      ),
      upcoming: inClinicProtocols.filter(p => {
        if (!p.next_expected_date) return false;
        const expected = new Date(p.next_expected_date);
        return expected > now && expected <= sevenDaysFromNow;
      })
    };

    // Weekly Pickups - Take-home weight loss patients expected this week
    const takeHomeWLProtocols = activeProtocols.filter(p =>
      p.delivery_method === 'take_home' &&
      p.program_type === 'weight_loss'
    );

    const weeklyPickups = {
      overdue: takeHomeWLProtocols.filter(p =>
        p.next_expected_date && p.next_expected_date < todayStr
      ).map(p => ({
        ...p,
        days_overdue: Math.floor((now - new Date(p.next_expected_date)) / (1000 * 60 * 60 * 24))
      })),
      dueToday: takeHomeWLProtocols.filter(p =>
        p.next_expected_date === todayStr
      ),
      upcoming: takeHomeWLProtocols.filter(p => {
        if (!p.next_expected_date) return false;
        const expected = new Date(p.next_expected_date);
        return expected > now && expected <= sevenDaysFromNow;
      }),
      needsPayment: takeHomeWLProtocols.filter(p =>
        (p.sessions_used || 0) >= (p.total_sessions || 0) && p.total_sessions > 0
      )
    };

    return res.status(200).json({
      success: true,
      timestamp: now.toISOString(),
      stats,
      protocolsByCategory,
      patients: patients || [],
      protocols: processedProtocols,
      completedProtocols,
      purchases: purchases || [],
      purchasesNeedingProtocol,
      injectionLogs: injectionLogs || [],
      intakes: intakes || [],
      clinicAppointments: clinicAppointments || [],
      leads,
      inClinicData,
      weeklyPickups,
      alerts: alerts || [],
      sessionAlerts,
    });

  } catch (error) {
    console.error('Command Center API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

function calculateProtocolUrgency(protocol, now) {
  const { program_type, delivery_method, start_date, end_date, total_sessions, sessions_used, last_refill_date } = protocol;

  // Session-based tracking (in-clinic)
  if (delivery_method === 'in_clinic' && total_sessions > 0) {
    const sessionsRemaining = total_sessions - (sessions_used || 0);
    if (sessionsRemaining <= 0) return 'expired';
    if (sessionsRemaining <= 1) return 'critical';
    if (sessionsRemaining <= 3) return 'warning';
    return 'active';
  }

  // Date-based tracking
  let endDateObj = null;

  if (end_date) {
    endDateObj = new Date(end_date);
  } else if (program_type === 'weight_loss' && start_date && total_sessions) {
    // Weight loss take-home: start_date + (sessions * 7 days)
    endDateObj = new Date(start_date);
    endDateObj.setDate(endDateObj.getDate() + (total_sessions * 7));
  } else if (program_type === 'hrt' && last_refill_date) {
    // HRT: estimate based on last refill
    endDateObj = new Date(last_refill_date);
    endDateObj.setDate(endDateObj.getDate() + 30); // Approximate 30 days
  }

  if (!endDateObj) return 'active';

  const daysRemaining = Math.floor((endDateObj - now) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'warning';
  if (daysRemaining <= 14) return 'active';
  return 'fresh';
}

function inferLeadStatus(contact) {
  const tags = (contact.tags || []).map(t => t.toLowerCase());
  if (tags.some(t => t.includes('converted') || t.includes('patient'))) return 'converted';
  if (tags.some(t => t.includes('no-response') || t.includes('no response') || t.includes('lost'))) return 'no-response';
  if (tags.some(t => t.includes('appointment') || t.includes('booked'))) return 'appointment-booked';
  if (tags.some(t => t.includes('contacted') || t.includes('replied'))) return 'contacted';
  return 'new';
}

function inferSource(tags) {
  const tagStr = (tags || []).join(' ').toLowerCase();
  if (tagStr.includes('quiz')) return 'quiz';
  if (tagStr.includes('instagram') || tagStr.includes('ig')) return 'instagram';
  if (tagStr.includes('facebook') || tagStr.includes('fb')) return 'facebook';
  if (tagStr.includes('referral') || tagStr.includes('sports therapy')) return 'referral';
  if (tagStr.includes('phone') || tagStr.includes('call')) return 'phone';
  if (tagStr.includes('walkin') || tagStr.includes('walk-in')) return 'walkin';
  return 'website';
}
