// /pages/api/patient-portal/[token].js
// Patient Portal API - Works with existing protocols table
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
    let protocols = [];
    let patient = null;

    // First, try to find in old protocols table by access_token
    const { data: oldProtocols, error: oldError } = await supabase
      .from('protocols')
      .select('*')
      .eq('access_token', token);

    if (oldProtocols?.length > 0) {
      // Found in old table - use that
      const first = oldProtocols[0];
      
      patient = {
        id: first.patient_id,
        first_name: first.patient_name?.split(' ')[0] || 'there',
        last_name: first.patient_name?.split(' ').slice(1).join(' ') || '',
        phone: first.patient_phone,
        email: first.patient_email,
        ghl_contact_id: first.ghl_contact_id
      };

      // Get injection logs for each protocol
      for (const p of oldProtocols) {
        const { data: logs } = await supabase
          .from('injection_logs')
          .select('*')
          .eq('protocol_id', p.id)
          .order('day_number', { ascending: true });

        // Generate sessions from logs or create empty ones
        const totalDays = p.total_sessions || p.total_days || 10;
        const sessions = [];
        const startDate = p.start_date ? new Date(p.start_date) : new Date();

        for (let i = 1; i <= totalDays; i++) {
          const sessionDate = new Date(startDate);
          sessionDate.setDate(startDate.getDate() + i - 1);
          
          const log = logs?.find(l => l.day_number === i);
          
          sessions.push({
            id: log?.id || `day-${i}`,
            session_number: i,
            scheduled_date: sessionDate.toISOString().split('T')[0],
            status: log?.completed ? 'completed' : 'scheduled',
            completed_at: log?.completed_at
          });
        }

        protocols.push({
          id: p.id,
          protocol_name: p.program_name || `${totalDays}-Day Recovery Protocol`,
          medication: p.primary_peptide,
          dosage: p.dose_amount,
          frequency: p.dose_frequency || 'daily',
          delivery_method: 'take_home',
          start_date: p.start_date,
          end_date: p.end_date,
          total_sessions: totalDays,
          sessions_completed: logs?.filter(l => l.completed).length || p.injections_completed || 0,
          status: p.status,
          category: 'peptide',
          checkin_type: 'recovery',
          checkin_due: true, // Simplified for now
          sessions
        });
      }
    } else {
      // Try new patient_protocols table
      const { data: newProtocols } = await supabase
        .from('patient_protocols')
        .select('*')
        .eq('access_token', token);

      if (newProtocols?.length > 0) {
        const first = newProtocols[0];
        
        patient = {
          id: first.patient_id,
          first_name: first.patient_name?.split(' ')[0] || 'there',
          last_name: first.patient_name?.split(' ').slice(1).join(' ') || '',
          phone: first.patient_phone,
          email: first.patient_email
        };

        for (const p of newProtocols) {
          const { data: sessions } = await supabase
            .from('protocol_sessions')
            .select('*')
            .eq('protocol_id', p.id)
            .order('session_number', { ascending: true });

          let category = 'peptide';
          let checkinType = 'recovery';
          
          if (p.protocol_name?.includes('HRT')) {
            category = 'hrt';
            checkinType = 'hrt';
          } else if (p.protocol_name?.includes('Weight')) {
            category = 'weight_loss';
            checkinType = 'weight_loss';
          } else if (p.protocol_name?.includes('Red Light') || p.protocol_name?.includes('HBOT')) {
            category = 'therapy';
          }

          protocols.push({
            ...p,
            category,
            checkin_type: checkinType,
            checkin_due: true,
            sessions: sessions || []
          });
        }
      }
    }

    // Also try to find by patient token
    if (protocols.length === 0) {
      // Check patient_portal_tokens if table exists
      try {
        const { data: tokenRecord } = await supabase
          .from('patient_portal_tokens')
          .select('patient_id, ghl_contact_id')
          .eq('token', token)
          .maybeSingle();

        if (tokenRecord) {
          // Get all protocols for this patient
          const { data: patientProtocols } = await supabase
            .from('protocols')
            .select('*')
            .or(`patient_id.eq.${tokenRecord.patient_id},ghl_contact_id.eq.${tokenRecord.ghl_contact_id}`)
            .eq('status', 'active');

          if (patientProtocols?.length > 0) {
            const first = patientProtocols[0];
            patient = {
              id: first.patient_id,
              first_name: first.patient_name?.split(' ')[0] || 'there',
              last_name: first.patient_name?.split(' ').slice(1).join(' ') || '',
              phone: first.patient_phone,
              email: first.patient_email
            };

            for (const p of patientProtocols) {
              const { data: logs } = await supabase
                .from('injection_logs')
                .select('*')
                .eq('protocol_id', p.id)
                .order('day_number', { ascending: true });

              const totalDays = p.total_sessions || p.total_days || 10;
              const sessions = [];
              const startDate = p.start_date ? new Date(p.start_date) : new Date();

              for (let i = 1; i <= totalDays; i++) {
                const sessionDate = new Date(startDate);
                sessionDate.setDate(startDate.getDate() + i - 1);
                const log = logs?.find(l => l.day_number === i);
                
                sessions.push({
                  id: log?.id || `day-${i}`,
                  session_number: i,
                  scheduled_date: sessionDate.toISOString().split('T')[0],
                  status: log?.completed ? 'completed' : 'scheduled',
                  completed_at: log?.completed_at
                });
              }

              protocols.push({
                id: p.id,
                protocol_name: p.program_name || `${totalDays}-Day Recovery Protocol`,
                medication: p.primary_peptide,
                dosage: p.dose_amount,
                frequency: p.dose_frequency || 'daily',
                delivery_method: 'take_home',
                start_date: p.start_date,
                end_date: p.end_date,
                total_sessions: totalDays,
                sessions_completed: logs?.filter(l => l.completed).length || 0,
                status: p.status,
                category: 'peptide',
                checkin_type: 'recovery',
                checkin_due: true,
                sessions
              });
            }
          }
        }
      } catch (e) {
        // Table might not exist, that's ok
        console.log('patient_portal_tokens table not found');
      }
    }

    if (protocols.length === 0) {
      return res.status(404).json({ error: 'No protocols found for this link' });
    }

    return res.status(200).json({
      patient: patient || { first_name: 'there' },
      protocols
    });

  } catch (error) {
    console.error('Portal API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
