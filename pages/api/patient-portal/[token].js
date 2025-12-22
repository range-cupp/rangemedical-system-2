// /pages/api/patient-portal/[token].js
// Patient Portal API - Get all protocols for patient
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Find patient by portal token
    let patientId = null;
    let ghlContactId = null;
    let patient = null;

    // Check patient_portal_tokens
    const { data: portalToken } = await supabase
      .from('patient_portal_tokens')
      .select('patient_id, ghl_contact_id')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (portalToken) {
      patientId = portalToken.patient_id;
      ghlContactId = portalToken.ghl_contact_id;
    }

    // Fallback: check patient_protocols access_token
    if (!patientId && !ghlContactId) {
      const { data: protocol } = await supabase
        .from('patient_protocols')
        .select('patient_id, ghl_contact_id, patient_name, patient_phone, patient_email')
        .eq('access_token', token)
        .maybeSingle();

      if (protocol) {
        patientId = protocol.patient_id;
        ghlContactId = protocol.ghl_contact_id;
        
        if (!patientId && !ghlContactId) {
          // Use protocol data as patient
          patient = {
            first_name: protocol.patient_name?.split(' ')[0] || 'there',
            last_name: protocol.patient_name?.split(' ').slice(1).join(' ') || '',
            email: protocol.patient_email,
            phone: protocol.patient_phone
          };
        }
      }
    }

    // Fetch patient record
    if (patientId && !patient) {
      const { data: p } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();
      patient = p;
    }

    if (!patientId && ghlContactId && !patient) {
      const { data: p } = await supabase
        .from('patients')
        .select('*')
        .eq('ghl_contact_id', ghlContactId)
        .maybeSingle();
      patient = p;
      if (p) patientId = p.id;
    }

    if (!patient && !patientId && !ghlContactId) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    // Get all protocols for this patient
    let protocolsQuery = supabase
      .from('patient_protocols')
      .select('*')
      .in('status', ['active', 'paused']);

    if (patientId && ghlContactId) {
      protocolsQuery = protocolsQuery.or(`patient_id.eq.${patientId},ghl_contact_id.eq.${ghlContactId}`);
    } else if (patientId) {
      protocolsQuery = protocolsQuery.eq('patient_id', patientId);
    } else if (ghlContactId) {
      protocolsQuery = protocolsQuery.eq('ghl_contact_id', ghlContactId);
    } else if (token) {
      // Fallback to access_token
      protocolsQuery = protocolsQuery.eq('access_token', token);
    }

    const { data: protocols, error: protocolError } = await protocolsQuery.order('created_at', { ascending: false });

    if (protocolError) {
      console.error('Protocol query error:', protocolError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Enrich protocols with sessions and checkin status
    const enrichedProtocols = [];
    const today = new Date().toISOString().split('T')[0];

    for (const p of (protocols || [])) {
      // Get sessions for peptide/therapy protocols
      let sessions = [];
      if (p.total_sessions) {
        const { data: sessionData } = await supabase
          .from('protocol_sessions')
          .select('*')
          .eq('protocol_id', p.id)
          .order('session_number', { ascending: true });
        sessions = sessionData || [];
      }

      // Get last checkin
      const { data: lastCheckin } = await supabase
        .from('protocol_checkins')
        .select('checkin_date')
        .eq('protocol_id', p.id)
        .order('checkin_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Determine checkin interval and if due
      let checkinInterval = 7; // default weekly
      let checkinType = 'recovery';
      
      if (p.protocol_name?.includes('HRT')) {
        checkinInterval = 30;
        checkinType = 'hrt';
      } else if (p.protocol_name?.includes('Weight')) {
        checkinInterval = 7;
        checkinType = 'weight_loss';
      }

      let checkinDue = true;
      if (lastCheckin?.checkin_date) {
        const daysSince = Math.floor((new Date() - new Date(lastCheckin.checkin_date)) / 86400000);
        checkinDue = daysSince >= checkinInterval;
      }

      // Determine category
      let category = 'peptide';
      if (p.protocol_name?.includes('HRT')) category = 'hrt';
      else if (p.protocol_name?.includes('Weight')) category = 'weight_loss';
      else if (p.protocol_name?.includes('Red Light') || p.protocol_name?.includes('HBOT')) category = 'therapy';

      enrichedProtocols.push({
        ...p,
        sessions,
        category,
        checkin_type: checkinType,
        checkin_due: checkinDue,
        last_checkin_date: lastCheckin?.checkin_date,
        symptom_checkin_days: checkinInterval
      });
    }

    return res.status(200).json({
      patient: patient || { first_name: 'there' },
      protocols: enrichedProtocols
    });

  } catch (error) {
    console.error('Portal API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
