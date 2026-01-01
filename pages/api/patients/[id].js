// /pages/api/patients/[id].js
// Patient profile API - returns patient info, protocols, labs, etc.

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

      // Get active protocols
      const { data: activeProtocols } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', id)
        .neq('status', 'completed')
        .order('start_date', { ascending: false });

      // Get completed protocols
      const { data: completedProtocols } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', id)
        .eq('status', 'completed')
        .order('end_date', { ascending: false });

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

      // Format notifications with correct field names
      const formattedNotifications = uniqueNotifications.map(n => ({
        id: n.id,
        product_name: n.item_name || n.product_name || 'Unknown',
        amount_paid: n.amount || n.amount_paid || 0,
        purchase_date: n.purchase_date,
        patient_id: n.patient_id,
        ghl_contact_id: n.ghl_contact_id,
        category: n.category
      }));

      // Get latest labs
      const { data: labs } = await supabase
        .from('labs')
        .select('*')
        .eq('patient_id', id)
        .order('test_date', { ascending: false })
        .limit(1);

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

      // Calculate days remaining for active protocols
      const formattedActive = (activeProtocols || []).map(p => {
        const endDate = p.end_date ? new Date(p.end_date) : null;
        const daysRemaining = endDate 
          ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
          : null;
        return { ...p, days_remaining: daysRemaining };
      });

      return res.status(200).json({
        patient,
        activeProtocols: formattedActive,
        completedProtocols: completedProtocols || [],
        pendingNotifications: formattedNotifications,
        latestLabs: labs?.[0] || null,
        labResults: labResults || [],
        baselineSymptoms: symptoms?.[0] || null,
        stats: {
          totalProtocols: (activeProtocols?.length || 0) + (completedProtocols?.length || 0),
          activeCount: activeProtocols?.length || 0,
          completedCount: completedProtocols?.length || 0
        }
      });

    } catch (error) {
      console.error('Patient API error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
