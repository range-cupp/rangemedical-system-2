// /pages/api/patients/[id].js
// Patient profile API - returns patient info, protocols, labs, lab orders, etc.
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  if (req.method === 'GET') {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError || !patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // AUTO-COMPLETE: Update protocols that are past their end date
      // Only for day-based protocols (not session-based packs)
      await supabase
        .from('protocols')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('patient_id', id)
        .eq('status', 'active')
        .lt('end_date', today)
        .is('total_sessions', null);  // Only day-based, not session-based

      // Get ALL protocols for this patient
      const { data: allProtocols } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', id)
        .order('start_date', { ascending: false });

      // Separate active vs completed
      const activeProtocols = [];
      const completedProtocols = [];

      (allProtocols || []).forEach(p => {
        const isCompleted = 
          p.status === 'completed' || 
          p.status === 'cancelled' ||
          (p.end_date && p.end_date < today && !p.total_sessions) ||
          (p.total_sessions && p.sessions_used >= p.total_sessions);

        if (isCompleted) {
          completedProtocols.push(p);
        } else if (p.status === 'active' || p.status === 'paused') {
          const endDate = p.end_date ? new Date(p.end_date) : null;
          const daysRemaining = endDate 
            ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
            : null;
          activeProtocols.push({ ...p, days_remaining: daysRemaining });
        }
      });

      // Get pending purchases (notifications)
      const { data: pendingNotifications } = await supabase
        .from('purchases')
        .select('*')
        .eq('patient_id', id)
        .eq('protocol_created', false)
        .eq('dismissed', false)
        .order('purchase_date', { ascending: false });

      // Also check by ghl_contact_id if patient has one
      let additionalNotifications = [];
      if (patient.ghl_contact_id) {
        const { data: ghlPurchases } = await supabase
          .from('purchases')
          .select('*')
          .eq('ghl_contact_id', patient.ghl_contact_id)
          .eq('protocol_created', false)
          .eq('dismissed', false)
          .order('purchase_date', { ascending: false });
        additionalNotifications = ghlPurchases || [];
      }

      // Merge and dedupe notifications
      const allNotifications = [...(pendingNotifications || []), ...additionalNotifications];
      const uniqueNotifications = allNotifications.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );

      // Map product_name for display
      const mappedNotifications = uniqueNotifications.map(n => ({
        ...n,
        product_name: n.item_name || n.product_name,
        amount_paid: n.amount || n.amount_paid
      }));

      // Get pending lab orders
      const { data: pendingLabOrders } = await supabase
        .from('lab_orders')
        .select('*, purchases(*)')
        .eq('patient_id', id)
        .eq('status', 'pending')
        .order('order_date', { ascending: false });

      // Get completed labs (from labs table)
      const { data: labs } = await supabase
        .from('labs')
        .select('*')
        .eq('patient_id', id)
        .order('test_date', { ascending: false });

      // Get lab results for detailed view
      const { data: labResults } = await supabase
        .from('lab_results')
        .select('*')
        .eq('patient_id', id)
        .order('test_date', { ascending: false });

      // Get baseline symptoms
      const { data: symptoms } = await supabase
        .from('symptom_responses')
        .select('*')
        .eq('patient_id', id)
        .order('submitted_at', { ascending: false })
        .limit(1);

      return res.status(200).json({
        patient,
        activeProtocols,
        completedProtocols,
        pendingNotifications: mappedNotifications,
        pendingLabOrders: pendingLabOrders || [],
        labs: labs || [],
        latestLabs: labs?.[0] || null,
        labResults: labResults || [],
        baselineSymptoms: symptoms?.[0] || null,
        stats: {
          totalProtocols: (activeProtocols?.length || 0) + (completedProtocols?.length || 0),
          activeCount: activeProtocols?.length || 0,
          completedCount: completedProtocols?.length || 0,
          pendingLabsCount: pendingLabOrders?.length || 0
        }
      });

    } catch (error) {
      console.error('Patient API error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
