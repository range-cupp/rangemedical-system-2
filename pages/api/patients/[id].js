// pages/api/patients/[id].js
// Patient Profile API - Range Medical
// Fetches patient details, protocols, labs, and purchases

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  if (req.method === 'GET') {
    try {
      // Get patient details
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError || !patient) {
        console.error('Patient not found:', patientError);
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Get ALL protocols for this patient first (for debugging)
      const { data: allProtocols, error: allProtocolsError } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', id);

      if (allProtocolsError) {
        console.error('Error fetching all protocols:', allProtocolsError);
      }

      console.log(`Patient ${id} has ${allProtocols?.length || 0} total protocols`);

      // Get active protocols (status != 'completed')
      const { data: activeProtocols, error: activeError } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', id)
        .neq('status', 'completed')
        .order('start_date', { ascending: false });

      if (activeError) {
        console.error('Error fetching active protocols:', activeError);
      }

      // Get completed protocols
      const { data: completedProtocols, error: completedError } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', id)
        .eq('status', 'completed')
        .order('end_date', { ascending: false });

      if (completedError) {
        console.error('Error fetching completed protocols:', completedError);
      }

      // Calculate days remaining for active protocols
      const today = new Date();
      const formattedActive = (activeProtocols || []).map(protocol => {
        let daysRemaining = null;
        if (protocol.end_date) {
          const endDate = new Date(protocol.end_date);
          daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        }
        return {
          ...protocol,
          days_remaining: daysRemaining
        };
      });

      // Get pending lab orders
      const { data: pendingLabOrders } = await supabase
        .from('lab_orders')
        .select('*')
        .eq('patient_id', id)
        .eq('status', 'pending')
        .order('order_date', { ascending: false });

      // Get lab results
      const { data: labs } = await supabase
        .from('patient_labs')
        .select('*')
        .eq('patient_id', id)
        .order('collection_date', { ascending: false });

      // Get pending purchases (needs protocol assignment)
      // Try both patient_id and ghl_contact_id
      let pendingNotifications = [];
      
      // First try by patient_id
      const { data: purchasesByPatientId } = await supabase
        .from('purchases')
        .select('*')
        .eq('patient_id', id)
        .eq('protocol_created', false)
        .eq('dismissed', false)
        .order('purchase_date', { ascending: false });

      if (purchasesByPatientId && purchasesByPatientId.length > 0) {
        pendingNotifications = purchasesByPatientId;
      } else if (patient.ghl_contact_id) {
        // Fall back to ghl_contact_id
        const { data: purchasesByGhl } = await supabase
          .from('purchases')
          .select('*')
          .eq('ghl_contact_id', patient.ghl_contact_id)
          .eq('protocol_created', false)
          .eq('dismissed', false)
          .order('purchase_date', { ascending: false });
        
        pendingNotifications = purchasesByGhl || [];
      }

      // Calculate stats
      const stats = {
        activeCount: formattedActive?.length || 0,
        completedCount: completedProtocols?.length || 0,
        pendingLabsCount: pendingLabOrders?.length || 0,
        totalProtocols: allProtocols?.length || 0
      };

      console.log('Returning:', {
        patientId: id,
        patientName: patient.name,
        activeProtocols: formattedActive?.length || 0,
        completedProtocols: completedProtocols?.length || 0,
        totalInDb: allProtocols?.length || 0
      });

      return res.status(200).json({
        patient,
        activeProtocols: formattedActive || [],
        completedProtocols: completedProtocols || [],
        pendingNotifications: pendingNotifications || [],
        pendingLabOrders: pendingLabOrders || [],
        labs: labs || [],
        stats
      });

    } catch (error) {
      console.error('Patient API error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  // Handle PATCH for updating patient
  if (req.method === 'PATCH') {
    try {
      const updates = req.body;
      
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update patient' });
      }

      return res.status(200).json({ patient: data });
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
