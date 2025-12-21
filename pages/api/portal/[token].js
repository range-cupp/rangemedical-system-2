// /pages/api/portal/[token].js
// Patient Portal API - Complete data for unified portal
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
    // Find patient by token
    let patient = null;
    let patientId = null;
    let ghlId = null;

    // Try patient_tokens table
    const { data: tokenData } = await supabase
      .from('patient_tokens')
      .select('patient_id')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (tokenData?.patient_id) {
      patientId = tokenData.patient_id;
    }

    // Fallback: protocols.access_token
    if (!patientId) {
      const { data: protocol } = await supabase
        .from('protocols')
        .select('patient_id, ghl_contact_id, patient_name, patient_email, patient_phone')
        .eq('access_token', token)
        .maybeSingle();

      if (protocol) {
        patientId = protocol.patient_id;
        ghlId = protocol.ghl_contact_id;
        
        // Try to find patient record
        if (ghlId) {
          const { data: p } = await supabase
            .from('patients')
            .select('*')
            .eq('ghl_contact_id', ghlId)
            .maybeSingle();
          
          if (p) {
            patient = p;
            patientId = p.id;
          }
        }
        
        // Create minimal patient from protocol if not found
        if (!patient) {
          patient = {
            first_name: protocol.patient_name?.split(' ')[0] || 'there',
            last_name: protocol.patient_name?.split(' ').slice(1).join(' ') || '',
            email: protocol.patient_email,
            phone: protocol.patient_phone,
            ghl_contact_id: ghlId
          };
        }
      }
    }

    // Fetch patient if we have ID but no patient object
    if (patientId && !patient) {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      patient = data;
      ghlId = patient?.ghl_contact_id;
    }

    if (!patient) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];

    // ========================================
    // FETCH PROTOCOLS AS PLAN BLOCKS
    // ========================================
    let blocks = [];

    // Get protocols for this patient
    const protocolQuery = patientId 
      ? `patient_id.eq.${patientId}` 
      : `ghl_contact_id.eq.${ghlId}`;
    
    const { data: protocols } = await supabase
      .from('protocols')
      .select('*')
      .or(patientId && ghlId ? `patient_id.eq.${patientId},ghl_contact_id.eq.${ghlId}` : protocolQuery)
      .eq('status', 'active');

    if (protocols?.length) {
      for (const p of protocols) {
        // Get injection logs for this protocol
        const { data: injectionLogs } = await supabase
          .from('injection_logs')
          .select('day_number, completed, completed_at')
          .eq('protocol_id', p.id)
          .eq('completed', true);

        blocks.push({
          id: p.id,
          block_type: mapProgramType(p.program_type),
          name: p.primary_peptide || p.program_name || 'Protocol',
          dose: p.dose_amount,
          frequency: p.dose_frequency,
          total_sessions: p.total_sessions || p.total_days || 10,
          sessions_completed: injectionLogs?.length || p.injections_completed || 0,
          start_date: p.start_date,
          end_date: p.end_date,
          status: 'active',
          injection_logs: injectionLogs || [],
          description: getPeptideDescription(p.primary_peptide)
        });
      }
    }

    // ========================================
    // CALCULATE PROGRESS
    // ========================================
    const progress = {};

    // Symptom progress
    if (patientId) {
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('*')
        .eq('patient_id', patientId)
        .order('check_in_date', { ascending: true });

      if (checkIns?.length >= 2) {
        const baseline = checkIns[0];
        const latest = checkIns[checkIns.length - 1];
        progress.symptoms = {};

        ['energy_score', 'sleep_score', 'mood_score', 'brain_fog_score', 'pain_score', 'libido_score'].forEach(key => {
          if (baseline[key] != null && latest[key] != null) {
            progress.symptoms[key.replace('_score', '')] = {
              baseline: baseline[key],
              current: latest[key]
            };
          }
        });
      }

      // Also use baseline_symptoms if available
      if (patient.baseline_symptoms && Object.keys(progress.symptoms || {}).length === 0) {
        const { data: latest } = await supabase
          .from('check_ins')
          .select('*')
          .eq('patient_id', patientId)
          .order('check_in_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest) {
          progress.symptoms = {};
          ['energy', 'sleep', 'mood', 'brain_fog', 'pain', 'libido'].forEach(key => {
            if (patient.baseline_symptoms[key] != null && latest[`${key}_score`] != null) {
              progress.symptoms[key] = {
                baseline: patient.baseline_symptoms[key],
                current: latest[`${key}_score`]
              };
            }
          });
        }
      }
    }

    // Weight progress
    if (patientId) {
      const { data: weightLogs } = await supabase
        .from('weight_logs')
        .select('weight, log_date')
        .eq('patient_id', patientId)
        .order('log_date', { ascending: true });

      if (weightLogs?.length >= 2) {
        progress.weight = {
          start: parseFloat(weightLogs[0].weight),
          current: parseFloat(weightLogs[weightLogs.length - 1].weight)
        };
      } else if (patient.start_weight && weightLogs?.length) {
        progress.weight = {
          start: parseFloat(patient.start_weight),
          current: parseFloat(weightLogs[weightLogs.length - 1].weight)
        };
      }
    }

    // Lab progress
    if (patientId) {
      const { data: labs } = await supabase
        .from('lab_results')
        .select('*')
        .eq('patient_id', patientId)
        .order('lab_date', { ascending: true });

      if (labs?.length) {
        const byMarker = {};
        labs.forEach(l => {
          if (!byMarker[l.marker_name]) byMarker[l.marker_name] = [];
          byMarker[l.marker_name].push(l);
        });

        progress.labs = Object.entries(byMarker)
          .filter(([_, vals]) => vals.length >= 2)
          .map(([marker, vals]) => ({
            name: formatMarkerName(marker),
            baseline: vals[0].value,
            current: vals[vals.length - 1].value,
            unit: vals[0].unit || '',
            higher_is_better: !isLowerBetter(marker)
          }));
      }
    }

    // ========================================
    // CALCULATE ACCOUNTABILITY
    // ========================================
    let totalActions = 0;
    let completedActions = 0;

    // From injection logs
    blocks.forEach(b => {
      const daysSinceStart = b.start_date 
        ? Math.floor((new Date() - new Date(b.start_date)) / 86400000) + 1
        : 30;
      const expectedActions = Math.min(daysSinceStart, b.total_sessions || 10);
      totalActions += expectedActions;
      completedActions += b.sessions_completed || 0;
    });

    const score = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    // ========================================
    // CHECK IF NEEDS CHECK-IN
    // ========================================
    let needsCheckIn = true;
    if (patientId) {
      const { data: lastCheckIn } = await supabase
        .from('check_ins')
        .select('check_in_date')
        .eq('patient_id', patientId)
        .order('check_in_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastCheckIn) {
        const daysSince = Math.floor((new Date() - new Date(lastCheckIn.check_in_date)) / 86400000);
        needsCheckIn = daysSince >= 7;
      }
    }

    // ========================================
    // BUILD NEXT ACTIONS
    // ========================================
    const nextActions = [];

    if (needsCheckIn) {
      nextActions.push({
        title: 'Weekly check-in',
        when: '2 minutes',
        type: 'check_in',
        actionable: true
      });
    }

    // Today's injections
    blocks.forEach(b => {
      if (shouldDoToday(b.frequency)) {
        const todayDayNumber = b.start_date 
          ? Math.floor((new Date() - new Date(b.start_date)) / 86400000) + 1
          : 1;
        const todayDone = b.injection_logs?.some(l => l.day_number === todayDayNumber);
        
        if (!todayDone) {
          nextActions.push({
            title: `Take ${b.name}`,
            when: 'Today',
            type: 'log',
            block_id: b.id,
            actionable: true
          });
        }
      }
    });

    // ========================================
    // RETURN DATA
    // ========================================
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
      
      accountability: { score, total: totalActions, completed: completedActions },
      streak: 0,
      
      next_actions: nextActions.slice(0, 5),
      needs_check_in: needsCheckIn
    });

  } catch (error) {
    console.error('Portal error:', error);
    return res.status(500).json({ error: 'Unable to load data' });
  }
}

// ========================================
// HELPERS
// ========================================

function mapProgramType(type) {
  if (!type) return 'peptide';
  if (type.includes('hrt')) return 'hrt';
  if (type.includes('iv')) return 'iv';
  if (type.includes('weight')) return 'peptide';
  return 'peptide';
}

function formatMarkerName(m) {
  const names = { vitamin_d: 'Vitamin D', testosterone: 'Testosterone', hgb: 'Hemoglobin', tsh: 'TSH', a1c: 'HbA1c' };
  return names[m] || m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function isLowerBetter(m) {
  return ['a1c', 'fasting_glucose', 'crp', 'psa'].includes(m.toLowerCase());
}

function shouldDoToday(freq) {
  const day = new Date().getDay();
  if (freq === 'daily' || freq === 'twice_daily') return true;
  if (freq === '5_on_2_off' && day >= 1 && day <= 5) return true;
  if (freq === 'weekly' && day === 1) return true;
  if (freq === '2x_weekly' && (day === 1 || day === 4)) return true;
  if (freq === '3x_weekly' && (day === 1 || day === 3 || day === 5)) return true;
  return false;
}

function getPeptideDescription(name) {
  const descriptions = {
    'BPC-157': 'Supports tissue repair and gut health. Often used for injury recovery and inflammation.',
    'TB-500': 'Promotes healing and flexibility. Works well with BPC-157 for recovery.',
    'Semaglutide': 'GLP-1 receptor agonist for weight management. Reduces appetite and improves metabolic health.',
    'Tirzepatide': 'Dual GIP/GLP-1 agonist for weight loss. Among the most effective weight management peptides.',
    'CJC-1295': 'Growth hormone releasing hormone. Supports muscle growth, fat loss, and recovery.',
    'Ipamorelin': 'Growth hormone secretagogue. Gentle release of growth hormone for anti-aging benefits.',
    'PT-141': 'Supports sexual health and libido in both men and women.',
    'Sermorelin': 'Stimulates natural growth hormone production. Supports sleep, energy, and body composition.'
  };
  return descriptions[name] || null;
}
