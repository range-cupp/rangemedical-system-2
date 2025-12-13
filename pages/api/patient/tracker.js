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

      // Calculate days info
      const today = new Date();
      const startDate = new Date(protocol.start_date);
      const endDate = new Date(protocol.end_date);
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
  const dose = protocol.dose_amount || 'as prescribed';
  const frequency = protocol.dose_frequency || '1x daily';
  const route = protocol.peptide_route || 'SC';
  const duration = protocol.duration_days;
  const goal = protocol.goal;

  // Route instructions
  const routeInstructions = {
    'SC': 'Inject subcutaneously (under the skin) in your belly or thigh. Pinch a fold of skin, insert the needle at a 45° angle, and inject slowly.',
    'IM': 'Inject intramuscularly into your thigh or deltoid muscle. Insert the needle at a 90° angle and inject slowly.',
    'IV': 'This is administered intravenously at the clinic.',
    'Intranasal': 'Spray into your nostril as directed.',
    'Oral': 'Take by mouth as directed.',
    'Topical': 'Apply to skin as directed.'
  };

  // Goal-specific tips
  const goalTips = {
    'recovery': 'For best results, stay hydrated and avoid intense exercise on injection days. BPC-157 and TB-500 work synergistically to accelerate tissue repair.',
    'metabolic': 'Take your injection in the morning on an empty stomach for optimal metabolic effects. Light fasting can enhance results.',
    'longevity': 'Consistency is key for longevity peptides. Take at the same time each day, preferably in the evening.',
    'aesthetic': 'GHK-Cu supports collagen production. Stay well-hydrated and protect your skin from sun exposure.'
  };

  let instructions = `
📋 YOUR PROTOCOL INSTRUCTIONS

💊 PEPTIDE${secondary ? 'S' : ''}
${peptide}${secondary ? ` + ${secondary}` : ''}

💉 DOSAGE
${dose} — ${frequency}

📅 DURATION
${duration} days

🎯 HOW TO INJECT
${routeInstructions[route] || routeInstructions['SC']}

⏰ TIMING
${frequency.includes('AM') ? 'Take in the morning' : 
  frequency.includes('PM') || frequency.includes('bedtime') ? 'Take in the evening/before bed' : 
  'Take at the same time each day for consistency'}

${goal ? `\n💡 TIP\n${goalTips[goal] || ''}` : ''}

📞 QUESTIONS?
Text or call Range Medical: (949) 891-5683

⚠️ STORAGE
Keep refrigerated (36-46°F). Do not freeze. Protect from light.
`.trim();

  return instructions;
}
