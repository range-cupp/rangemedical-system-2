// /pages/api/portal/[token].js
// Patient Portal API - Simplified version
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
    // Find protocol(s) by access_token directly
    const { data: protocols, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('access_token', token);

    if (protocolError) {
      console.error('Protocol query error:', protocolError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!protocols || protocols.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    // Get patient info from first protocol
    const firstProtocol = protocols[0];
    let patient = null;

    // Try to find linked patient record
    if (firstProtocol.patient_id) {
      const { data: p } = await supabase
        .from('patients')
        .select('*')
        .eq('id', firstProtocol.patient_id)
        .maybeSingle();
      patient = p;
    }
    
    if (!patient && firstProtocol.ghl_contact_id) {
      const { data: p } = await supabase
        .from('patients')
        .select('*')
        .eq('ghl_contact_id', firstProtocol.ghl_contact_id)
        .maybeSingle();
      patient = p;
    }

    // Fallback to protocol data
    if (!patient) {
      patient = {
        first_name: firstProtocol.patient_name?.split(' ')[0] || 'there',
        last_name: firstProtocol.patient_name?.split(' ').slice(1).join(' ') || '',
        email: firstProtocol.patient_email,
        phone: firstProtocol.patient_phone
      };
    }

    // Build blocks from protocols
    const blocks = [];
    
    for (const p of protocols) {
      // Get ALL injection logs for this protocol (not just completed)
      const { data: injectionLogs } = await supabase
        .from('injection_logs')
        .select('day_number, completed, completed_at')
        .eq('protocol_id', p.id);

      const completedLogs = (injectionLogs || []).filter(l => l.completed);

      blocks.push({
        id: p.id,
        block_type: getBlockType(p.program_type),
        name: p.primary_peptide || p.program_name || 'Protocol',
        dose: p.dose_amount,
        frequency: p.dose_frequency,
        total_sessions: p.total_sessions || p.total_days || 10,
        sessions_completed: completedLogs.length || p.injections_completed || 0,
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status,
        injection_logs: completedLogs,
        description: getPeptideDescription(p.primary_peptide)
      });
    }

    // Calculate accountability
    let totalExpected = 0;
    let totalCompleted = 0;

    blocks.forEach(b => {
      const total = b.total_sessions || 10;
      const daysSinceStart = b.start_date 
        ? Math.min(Math.floor((new Date() - new Date(b.start_date)) / 86400000) + 1, total)
        : total;
      totalExpected += daysSinceStart;
      totalCompleted += b.sessions_completed;
    });

    const score = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

    // Check if needs check-in
    let needsCheckIn = true;
    if (patient.id) {
      const { data: lastCheckIn } = await supabase
        .from('check_ins')
        .select('check_in_date')
        .eq('patient_id', patient.id)
        .order('check_in_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastCheckIn) {
        const daysSince = Math.floor((new Date() - new Date(lastCheckIn.check_in_date)) / 86400000);
        needsCheckIn = daysSince >= 7;
      }
    }

    // Build next actions
    const nextActions = [];
    if (needsCheckIn) {
      nextActions.push({
        title: 'Weekly check-in',
        when: '2 minutes',
        type: 'check_in',
        actionable: true
      });
    }

    // Get progress data
    const progress = {};
    
    if (patient.id) {
      // Check-in progress
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('*')
        .eq('patient_id', patient.id)
        .order('check_in_date', { ascending: true });

      if (checkIns?.length >= 2) {
        const first = checkIns[0];
        const last = checkIns[checkIns.length - 1];
        progress.symptoms = {};
        
        ['energy_score', 'sleep_score', 'mood_score', 'brain_fog_score'].forEach(key => {
          if (first[key] != null && last[key] != null) {
            progress.symptoms[key.replace('_score', '')] = {
              baseline: first[key],
              current: last[key]
            };
          }
        });
      }

      // Weight progress
      const { data: weights } = await supabase
        .from('weight_logs')
        .select('weight')
        .eq('patient_id', patient.id)
        .order('log_date', { ascending: true });

      if (weights?.length >= 2) {
        progress.weight = {
          start: parseFloat(weights[0].weight),
          current: parseFloat(weights[weights.length - 1].weight)
        };
      }
    }

    return res.status(200).json({
      id: patient.id,
      first_name: patient.first_name || 'there',
      last_name: patient.last_name,
      email: patient.email,
      
      primary_goals: patient.primary_goals || [],
      why_now: patient.why_now,
      importance_score: patient.importance_score,
      
      plan_blocks: blocks,
      progress,
      
      accountability: { score, total: totalExpected, completed: totalCompleted },
      streak: 0,
      
      next_actions: nextActions,
      needs_check_in: needsCheckIn
    });

  } catch (error) {
    console.error('Portal error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}

function getBlockType(type) {
  if (!type) return 'peptide';
  if (type.includes('hrt')) return 'hrt';
  if (type.includes('iv')) return 'iv';
  return 'peptide';
}

function getPeptideDescription(name) {
  const descriptions = {
    'BPC-157': 'Supports tissue repair and gut health.',
    'TB-500': 'Promotes healing and flexibility.',
    'Semaglutide': 'GLP-1 agonist for weight management.',
    'Tirzepatide': 'Dual agonist for weight loss.',
    'KPV': 'Anti-inflammatory peptide.'
  };
  return descriptions[name] || null;
}
