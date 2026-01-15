// =====================================================
// NEXT.JS API ROUTES FOR HRT TRACKING
// /pages/api/hrt/[...path].js
// Range Medical
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : path;

  try {
    // Route matching
    switch (true) {
      // GET /api/hrt/membership/:contactId - Patient dashboard
      case req.method === 'GET' && /^membership\/[\w-]+$/.test(pathStr):
        return await getPatientDashboard(req, res);

      // GET /api/hrt/staff/dashboard - Staff dashboard
      case req.method === 'GET' && pathStr === 'staff/dashboard':
        return await getStaffDashboard(req, res);

      // POST /api/hrt/membership - Create membership
      case req.method === 'POST' && pathStr === 'membership':
        return await createMembership(req, res);

      // PUT /api/hrt/membership/:id - Update membership
      case req.method === 'PUT' && /^membership\/[\w-]+$/.test(pathStr):
        return await updateMembership(req, res);

      // POST /api/hrt/payment - Process payment
      case req.method === 'POST' && pathStr === 'payment':
        return await processPayment(req, res);

      // POST /api/hrt/iv/mark-used - Mark IV used
      case req.method === 'POST' && pathStr === 'iv/mark-used':
        return await markIvUsed(req, res);

      // POST /api/hrt/lab - Record lab
      case req.method === 'POST' && pathStr === 'lab':
        return await recordLab(req, res);

      // GET /api/hrt/history/:membershipId - Get full history
      case req.method === 'GET' && /^history\/[\w-]+$/.test(pathStr):
        return await getMembershipHistory(req, res);

      // GET /api/hrt/reminders/iv - Get IV reminders
      case req.method === 'GET' && pathStr === 'reminders/iv':
        return await getIvReminders(req, res);

      // GET /api/hrt/reminders/labs - Get lab reminders
      case req.method === 'GET' && pathStr === 'reminders/labs':
        return await getLabReminders(req, res);

      // POST /api/hrt/reminders/mark-sent/:periodId
      case req.method === 'POST' && /^reminders\/mark-sent\/[\w-]+$/.test(pathStr):
        return await markReminderSent(req, res);

      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// =====================================================
// HANDLERS
// =====================================================

async function getPatientDashboard(req, res) {
  const contactId = req.query.path[1];

  // Get membership with current period
  const { data: membership, error: membershipError } = await supabase
    .from('v_patient_hrt_dashboard')
    .select('*')
    .eq('ghl_contact_id', contactId)
    .single();

  if (membershipError && membershipError.code !== 'PGRST116') {
    throw membershipError;
  }

  if (!membership) {
    return res.json({ success: false, error: 'No active HRT membership found' });
  }

  // Get all periods for history
  const { data: periods } = await supabase
    .from('hrt_monthly_periods')
    .select('*')
    .eq('membership_id', membership.membership_id)
    .order('period_start', { ascending: false })
    .limit(12);

  // Get lab history
  const { data: labs } = await supabase
    .from('hrt_lab_history')
    .select('*')
    .eq('membership_id', membership.membership_id)
    .order('lab_date', { ascending: false });

  return res.json({
    success: true,
    data: {
      membership,
      periods: periods || [],
      labs: labs || [],
      summary: {
        ivAvailable: membership.iv_available && !membership.iv_used,
        daysUntilIvExpires: membership.days_remaining,
        nextLabDue: membership.next_lab_due,
        labStatus: membership.lab_status,
        monthsActive: membership.months_active
      }
    }
  });
}

async function getStaffDashboard(req, res) {
  const { ivStatus, labStatus, membershipType } = req.query;

  let query = supabase
    .from('v_staff_hrt_dashboard')
    .select('*');

  // Apply filters
  if (ivStatus === 'unused') {
    query = query.eq('iv_used', false);
  }
  if (ivStatus === 'urgent') {
    query = query.eq('iv_used', false).lte('days_left_in_period', 7);
  }
  if (labStatus === 'overdue') {
    query = query.eq('lab_status', 'OVERDUE');
  }
  if (labStatus === 'due_soon') {
    query = query.in('lab_status', ['Due this week', 'Due soon']);
  }
  if (membershipType && membershipType !== 'all') {
    query = query.eq('membership_type', membershipType);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Calculate summary
  const summary = {
    totalActive: data.length,
    ivsAvailable: data.filter(m => m.iv_available && !m.iv_used).length,
    ivsUrgent: data.filter(m => !m.iv_used && m.days_left_in_period <= 7).length,
    labsOverdue: data.filter(m => m.lab_status === 'OVERDUE').length,
    labsDueSoon: data.filter(m => ['Due this week', 'Due soon'].includes(m.lab_status)).length
  };

  return res.json({
    success: true,
    data: {
      memberships: data,
      summary
    }
  });
}

async function createMembership(req, res) {
  const {
    contactId,
    patientName,
    patientEmail,
    patientPhone,
    membershipType,
    initialLabDate,
    initialLabType,
    startDate
  } = req.body;

  const { data, error } = await supabase.rpc('create_hrt_membership', {
    p_contact_id: contactId,
    p_patient_name: patientName,
    p_patient_email: patientEmail,
    p_patient_phone: patientPhone,
    p_membership_type: membershipType,
    p_initial_lab_date: initialLabDate,
    p_initial_lab_type: initialLabType,
    p_start_date: startDate || new Date().toISOString().split('T')[0]
  });

  if (error) throw error;
  return res.json({ success: true, data });
}

async function updateMembership(req, res) {
  const membershipId = req.query.path[1];
  const updates = req.body;

  const allowedFields = [
    'status', 'next_lab_due', 'next_lab_type', 'notes',
    'subscription_id', 'billing_day', 'monthly_rate'
  ];

  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }
  filteredUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('hrt_memberships')
    .update(filteredUpdates)
    .eq('id', membershipId)
    .select()
    .single();

  if (error) throw error;
  return res.json({ success: true, data });
}

async function processPayment(req, res) {
  const { contactId, amount, paymentId } = req.body;

  const { data, error } = await supabase.rpc('process_hrt_payment', {
    p_contact_id: contactId,
    p_payment_amount: amount,
    p_payment_id: paymentId
  });

  if (error) throw error;
  return res.json({ success: true, data });
}

async function markIvUsed(req, res) {
  const { contactId, appointmentId, appointmentDate } = req.body;

  const { data, error } = await supabase.rpc('mark_iv_used', {
    p_contact_id: contactId,
    p_appointment_id: appointmentId,
    p_appointment_date: appointmentDate
  });

  if (error) throw error;
  return res.json({ success: true, data });
}

async function recordLab(req, res) {
  const { membershipId, labType, labDate, labProvider, notes } = req.body;

  const { data, error } = await supabase
    .from('hrt_lab_history')
    .insert({
      membership_id: membershipId,
      lab_type: labType,
      lab_date: labDate,
      lab_provider: labProvider,
      notes,
      status: 'completed'
    })
    .select()
    .single();

  if (error) throw error;
  return res.json({ success: true, data });
}

async function getMembershipHistory(req, res) {
  const membershipId = req.query.path[1];

  const { data: membership, error: membershipError } = await supabase
    .from('hrt_memberships')
    .select('*')
    .eq('id', membershipId)
    .single();

  if (membershipError) throw membershipError;

  const { data: periods } = await supabase
    .from('hrt_monthly_periods')
    .select('*')
    .eq('membership_id', membershipId)
    .order('period_start', { ascending: false });

  const { data: labs } = await supabase
    .from('hrt_lab_history')
    .select('*')
    .eq('membership_id', membershipId)
    .order('lab_date', { ascending: false });

  const periodsArr = periods || [];
  return res.json({
    success: true,
    data: {
      membership,
      periods: periodsArr,
      labs: labs || [],
      stats: {
        totalMonths: periodsArr.length,
        ivsUsed: periodsArr.filter(p => p.iv_used).length,
        ivsMissed: periodsArr.filter(p => !p.iv_used && new Date(p.period_end) < new Date()).length,
        totalLabs: (labs || []).length
      }
    }
  });
}

async function getIvReminders(req, res) {
  const daysRemaining = parseInt(req.query.days) || 7;

  const { data, error } = await supabase.rpc('get_iv_reminder_list', {
    p_days_remaining: daysRemaining
  });

  if (error) throw error;
  return res.json({ success: true, data });
}

async function getLabReminders(req, res) {
  const { data, error } = await supabase.rpc('get_lab_due_list');

  if (error) throw error;
  return res.json({ success: true, data });
}

async function markReminderSent(req, res) {
  const periodId = req.query.path[2];

  const { data, error } = await supabase
    .from('hrt_monthly_periods')
    .update({
      iv_reminder_sent: true,
      iv_reminder_sent_at: new Date().toISOString()
    })
    .eq('id', periodId)
    .select()
    .single();

  if (error) throw error;
  return res.json({ success: true, data });
}
