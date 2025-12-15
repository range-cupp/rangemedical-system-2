// =====================================================
// STAFF HRT DASHBOARD API
// /pages/api/hrt/staff/dashboard.js
// Returns all HRT members with IV and lab status
// Range Medical
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
    // Get all active memberships with their current period
    const { data: memberships, error: membershipError } = await supabase
      .from('hrt_memberships')
      .select(`
        id,
        ghl_contact_id,
        patient_name,
        patient_email,
        patient_phone,
        membership_type,
        status,
        start_date,
        next_lab_due,
        next_lab_type
      `)
      .eq('status', 'active')
      .order('patient_name');

    if (membershipError) throw membershipError;

    // Get current month periods for all memberships
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: periods, error: periodError } = await supabase
      .from('hrt_monthly_periods')
      .select('*')
      .gte('period_start', currentMonthStart)
      .lte('period_start', currentMonthEnd);

    if (periodError) throw periodError;

    // Create a map of periods by membership_id
    const periodMap = {};
    for (const period of periods || []) {
      periodMap[period.membership_id] = period;
    }

    // Combine data
    const today = new Date();
    const enrichedMemberships = memberships.map(m => {
      const period = periodMap[m.id] || {};
      const periodEnd = period.period_end ? new Date(period.period_end) : new Date(currentMonthEnd);
      const daysLeft = Math.ceil((periodEnd - today) / (1000 * 60 * 60 * 24));

      // Calculate lab status
      let labStatus = 'On track';
      if (m.next_lab_due) {
        const labDue = new Date(m.next_lab_due);
        const daysUntilLab = Math.ceil((labDue - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilLab < 0) {
          labStatus = 'OVERDUE';
        } else if (daysUntilLab <= 7) {
          labStatus = 'Due this week';
        } else if (daysUntilLab <= 14) {
          labStatus = 'Due soon';
        }
      }

      // Calculate IV status
      let ivStatus = 'Available';
      if (period.iv_used) {
        ivStatus = 'Used';
      } else if (daysLeft <= 3) {
        ivStatus = 'Urgent - Expiring!';
      } else if (daysLeft <= 7) {
        ivStatus = 'Reminder Needed';
      }

      return {
        membership_id: m.id,
        ghl_contact_id: m.ghl_contact_id,
        patient_name: m.patient_name,
        patient_email: m.patient_email,
        patient_phone: m.patient_phone,
        membership_type: m.membership_type,
        status: m.status,
        start_date: m.start_date,
        
        // Period info
        current_period: period.period_label || 'December 2024',
        period_start: period.period_start,
        period_end: period.period_end,
        
        // IV info
        iv_available: period.iv_available !== false,
        iv_used: period.iv_used || false,
        iv_appointment_date: period.iv_appointment_date,
        days_left_in_period: Math.max(0, daysLeft),
        iv_status: ivStatus,
        
        // Lab info
        next_lab_due: m.next_lab_due,
        next_lab_type: m.next_lab_type,
        lab_status: labStatus
      };
    });

    // Calculate summary
    const summary = {
      totalActive: enrichedMemberships.length,
      ivsAvailable: enrichedMemberships.filter(m => !m.iv_used).length,
      ivsUsed: enrichedMemberships.filter(m => m.iv_used).length,
      ivsUrgent: enrichedMemberships.filter(m => !m.iv_used && m.days_left_in_period <= 7).length,
      labsOverdue: enrichedMemberships.filter(m => m.lab_status === 'OVERDUE').length,
      labsDueSoon: enrichedMemberships.filter(m => ['Due this week', 'Due soon'].includes(m.lab_status)).length
    };

    return res.status(200).json({
      success: true,
      data: {
        memberships: enrichedMemberships,
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
