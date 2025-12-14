// /pages/api/patient/tracker.js
// API for patient injection tracking

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  // GET - Fetch protocol and injection logs
  if (req.method === 'GET') {
    try {
      // Fetch protocol by access token
      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .select('*')
        .eq('access_token', token)
        .single();

      if (protocolError || !protocol) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      // Fetch injection logs
      const { data: logs, error: logsError } = await supabase
        .from('injection_logs')
        .select('*')
        .eq('protocol_id', protocol.id)
        .order('day_number', { ascending: true });

      // Calculate days info (use PST/PDT timezone - Los Angeles)
      const now = new Date();
      // Get current date in Los Angeles timezone
      const pstDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // 'en-CA' gives YYYY-MM-DD format
      const today = new Date(pstDateStr + 'T12:00:00');
      
      const startDate = new Date(protocol.start_date + 'T12:00:00');
      const endDate = new Date(protocol.end_date + 'T12:00:00');
      const currentDay = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const totalDays = protocol.duration_days;

      // Build days array
      const days = [];
      for (let i = 1; i <= totalDays; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + i - 1);
        
        const log = logs?.find(l => l.day_number === i);
        
        days.push({
          day: i,
          date: dayDate.toISOString().split('T')[0],
          completed: !!log,
          completedAt: log?.completed_at || null,
          isCurrent: i === currentDay,
          isPast: i < currentDay,
          isFuture: i > currentDay
        });
      }

      // Generate dosing instructions
      const dosingInstructions = generateDosingInstructions(protocol);

      return res.status(200).json({
        protocol: {
          id: protocol.id,
          patientName: protocol.patient_name,
          programName: protocol.program_name,
          primaryPeptide: protocol.primary_peptide,
          secondaryPeptide: protocol.secondary_peptide,
          doseAmount: protocol.dose_amount,
          doseFrequency: protocol.dose_frequency,
          route: protocol.peptide_route || 'SC',
          startDate: protocol.start_date,
          endDate: protocol.end_date,
          totalDays: totalDays,
          currentDay: currentDay,
          status: protocol.status,
          specialInstructions: protocol.special_instructions,
          goal: protocol.goal
        },
        days,
        dosingInstructions,
        completionRate: Math.round((logs?.length || 0) / totalDays * 100)
      });

    } catch (error) {
      console.error('Tracker GET error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // POST - Mark injection complete
  if (req.method === 'POST') {
    const { day, notes } = req.body;

    if (!day) {
      return res.status(400).json({ error: 'Day number required' });
    }

    try {
      // Get protocol ID from token
      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .select('id, duration_days')
        .eq('access_token', token)
        .single();

      if (protocolError || !protocol) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      // Validate day number
      if (day < 1 || day > protocol.duration_days) {
        return res.status(400).json({ error: 'Invalid day number' });
      }

      // Insert or ignore if already exists
      const { data, error } = await supabase
        .from('injection_logs')
        .upsert({
          protocol_id: protocol.id,
          day_number: day,
          notes: notes || null,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'protocol_id,day_number'
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ error: 'Failed to log injection' });
      }

      return res.status(200).json({ success: true, log: data });

    } catch (error) {
      console.error('Tracker POST error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // DELETE - Unmark injection
  if (req.method === 'DELETE') {
    const { day } = req.body;

    if (!day) {
      return res.status(400).json({ error: 'Day number required' });
    }

    try {
      // Get protocol ID from token
      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .select('id')
        .eq('access_token', token)
        .single();

      if (protocolError || !protocol) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      // Delete the log
      const { error } = await supabase
        .from('injection_logs')
        .delete()
        .eq('protocol_id', protocol.id)
        .eq('day_number', day);

      if (error) {
        console.error('Delete error:', error);
        return res.status(500).json({ error: 'Failed to delete log' });
      }

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('Tracker DELETE error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


// Generate dosing instructions text
function generateDosingInstructions(protocol) {
  const peptide = protocol.primary_peptide || 'your peptide';
  const secondary = protocol.secondary_peptide;
  const dose = protocol.dose_amount || 'as directed';
  const frequency = protocol.dose_frequency || '1x daily';
  const route = protocol.peptide_route || 'SC';
  const duration = protocol.duration_days;
  const goal = protocol.goal;

  // Determine timing based on peptide type
  const getPeptideTiming = (peptideName) => {
    if (!peptideName) return null;
    const name = peptideName.toLowerCase();

    // NIGHTTIME - Growth Hormone Secretagogues (before bed, fasted)
    if (name.includes('sermorelin') || name.includes('tesamorelin') || 
        name.includes('ipamorelin') || name.includes('cjc') ||
        name.includes('ghrp') || name.includes('hexarelin') ||
        name.includes('mk-677') || name.includes('ibutamoren')) {
      return {
        when: 'NIGHTTIME — Before Bed',
        instructions: 'Take right before bed. Do not eat for 2 hours before your injection. This works with your natural growth hormone release during sleep.',
        fasting: true
      };
    }

    // NIGHTTIME - Sleep peptides
    if (name.includes('dsip')) {
      return {
        when: 'NIGHTTIME — 30-60 Min Before Bed',
        instructions: 'Take 30-60 minutes before you want to fall asleep.',
        fasting: false
      };
    }

    // MORNING - Metabolic peptides (fasted)
    if (name.includes('aod') || name.includes('mots')) {
      return {
        when: 'MORNING — Empty Stomach',
        instructions: 'Take in the morning on an empty stomach. Wait 20-30 minutes before eating for best results.',
        fasting: true
      };
    }

    // MORNING - Cognitive/Energy (may affect sleep)
    if (name.includes('semax') || name.includes('tesofensine')) {
      return {
        when: 'MORNING',
        instructions: 'Take in the morning. Avoid taking late in the day as it may affect sleep.',
        fasting: false
      };
    }

    // MORNING - Oral metabolic
    if (name.includes('5-amino') || name.includes('1mq')) {
      return {
        when: 'MORNING',
        instructions: 'Take in the morning. Can be taken with or without food.',
        fasting: false
      };
    }

    // AS NEEDED - PT-141
    if (name.includes('pt-141')) {
      return {
        when: 'AS NEEDED — 45-60 Min Before',
        instructions: 'Take 45-60 minutes before desired effect. Do not use more than once in 24 hours or more than 8 times per month.',
        fasting: false
      };
    }

    // WEEKLY - GLP-1 peptides
    if (name.includes('glp-1') || name.includes('semaglutide') || 
        name.includes('tirzepatide') || name.includes('retatrutide') ||
        name.includes('survodutide') || name.includes('cagrilintide')) {
      return {
        when: 'ONCE WEEKLY — Same Day Each Week',
        instructions: 'Take once a week on the same day. Can be taken with or without food. Eat slowly and stop when you feel full. Drink plenty of water.',
        fasting: false
      };
    }

    // ANY TIME - Most healing/recovery peptides
    if (name.includes('bpc') || name.includes('tb-500') || name.includes('tb500') ||
        name.includes('wolverine') || name.includes('ghk') || name.includes('glow') ||
        name.includes('klow') || name.includes('kpv')) {
      return {
        when: 'ANY TIME — Consistent Daily',
        instructions: 'Can be taken any time of day. Take at the same time each day for consistency. Works with or without food.',
        fasting: false
      };
    }

    // ANY TIME - Immune/Longevity
    if (name.includes('thymosin alpha') || name.includes('ta-1') || name.includes('ta1') ||
        name.includes('epithalon') || name.includes('ll-37')) {
      return {
        when: 'ANY TIME — Consistent Daily',
        instructions: 'Can be taken any time of day. Take at the same time each day for consistency.',
        fasting: false
      };
    }

    // ANY TIME - Fertility support
    if (name.includes('gonadorelin') || name.includes('hcg') || name.includes('kisspeptin')) {
      return {
        when: '2-3x WEEKLY — Any Time',
        instructions: 'Usually taken 2-3 times per week. Can be taken any time of day.',
        fasting: false
      };
    }

    // NASAL - Cognitive
    if (name.includes('selank')) {
      return {
        when: 'ANY TIME — As Needed',
        instructions: 'Use 1-2 sprays in each nostril. Can be used any time you need focus and calm.',
        fasting: false
      };
    }

    // NAD+
    if (name.includes('nad')) {
      return {
        when: 'ANY TIME',
        instructions: 'Can be taken any time of day. You may feel flushing or warmth after injection — this is normal and passes quickly.',
        fasting: false
      };
    }

    // BEFORE BED - Melanotan
    if (name.includes('melanotan') || name.includes('mt-ii') || name.includes('mt-2')) {
      return {
        when: 'EVENING — Before Bed',
        instructions: 'Take before bed to minimize side effects. Start with a very low dose. Some nausea is normal at first.',
        fasting: false
      };
    }

    // Default
    return {
      when: 'CONSISTENT DAILY',
      instructions: 'Take at the same time each day for best results. Follow your provider\'s specific instructions.',
      fasting: false
    };
  };

  // Get timing for primary peptide
  const timing = getPeptideTiming(peptide);
  
  // Check if secondary peptide has different timing requirements
  let secondaryNote = '';
  if (secondary) {
    const secondaryTiming = getPeptideTiming(secondary);
    if (secondaryTiming && secondaryTiming.when !== timing.when) {
      // Check for conflicts (e.g., one morning, one night)
      if ((timing.when.includes('NIGHT') && secondaryTiming.when.includes('MORNING')) ||
          (timing.when.includes('MORNING') && secondaryTiming.when.includes('NIGHT'))) {
        secondaryNote = `\nNote: If taking ${secondary} separately, follow its specific timing.`;
      }
    }
  }

  // Route instructions
  const routeInstructions = {
    'SC': 'Inject under the skin (subcutaneous) in your belly or thigh.\n   • Pinch a fold of skin\n   • Insert needle at 45° angle\n   • Inject slowly\n   • Release skin, remove needle',
    'IM': 'Inject into muscle (intramuscular) in your thigh or shoulder.\n   • Insert needle at 90° angle\n   • Inject slowly\n   • Remove needle',
    'IV': 'Administered at the clinic by our medical team.',
    'Intranasal': 'Spray into nostril as directed.\n   • Clear nose first\n   • Insert tip into nostril\n   • Spray while breathing in gently',
    'Oral': 'Take by mouth as directed.\n   • Swallow with water\n   • Follow any food/fasting instructions',
    'Topical': 'Apply to clean, dry skin as directed.'
  };

  // Frequency display
  const getFrequencyDisplay = (freq) => {
    if (freq.includes('5 days on')) return '5 days on, 2 days off';
    return freq;
  };

  let instructions = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         RANGE MEDICAL
      Your Protocol Instructions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PEPTIDE${secondary ? 'S' : ''}
${peptide}${secondary ? `\n${secondary}` : ''}

DOSE
${dose}

FREQUENCY
${getFrequencyDisplay(frequency)}

DURATION
${duration} days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHEN TO TAKE
${timing.when}

${timing.instructions}${secondaryNote}
${timing.fasting ? '\nDo not eat for 2 hours before injection.' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW TO ${route === 'Oral' ? 'TAKE' : route === 'Intranasal' ? 'USE' : 'INJECT'}
${routeInstructions[route] || routeInstructions['SC']}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STORAGE
Keep refrigerated (36-46°F)
Do not freeze
Protect from light

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTIONS?
Text or call us anytime
(949) 997-3988

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`.trim();

  return instructions;
}
