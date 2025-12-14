import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    const { data: patientToken, error: tokenError } = await supabase
      .from('patient_access_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !patientToken) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    await supabase
      .from('patient_access_tokens')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', patientToken.id);

    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .eq('ghl_contact_id', patientToken.ghl_contact_id)
      .order('start_date', { ascending: false });

    if (protocolsError) {
      console.error('Protocols error:', protocolsError);
      return res.status(500).json({ error: 'Failed to load protocols' });
    }

    const protocolIds = protocols.map(p => p.id);
    let injectionLogs = [];
    if (protocolIds.length > 0) {
      const { data: logs } = await supabase
        .from('injection_logs')
        .select('*')
        .in('protocol_id', protocolIds);
      injectionLogs = logs || [];
    }

    const peptideNames = protocols.map(p => p.primary_peptide).filter(Boolean);
    let peptideTools = [];
    if (peptideNames.length > 0) {
      const { data: tools } = await supabase
        .from('peptide_tools')
        .select('name, category')
        .in('name', peptideNames);
      peptideTools = tools || [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

    const protocolsWithDays = protocols.map(protocol => {
      const peptideTool = peptideTools.find(t => t.name === protocol.primary_peptide);
      const category = peptideTool?.category || null;
      const startDate = new Date(protocol.start_date);
      const days = [];
      
      for (let i = 0; i < protocol.duration_days; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        const dayNumber = i + 1;
        const dateStr = dayDate.toISOString().split('T')[0];
        const log = injectionLogs.find(l => l.protocol_id === protocol.id && l.day_number === dayNumber);
        
        days.push({
          day: dayNumber,
          date: dateStr,
          completed: !!log,
          completedAt: log?.completed_at || null,
          isCurrent: dateStr === todayStr,
          isFuture: dayDate > today
        });
      }

      return { ...protocol, category, days, access_token: protocol.access_token };
    });

    return res.status(200).json({
      patient: {
        name: patientToken.patient_name,
        email: patientToken.patient_email,
        phone: patientToken.patient_phone
      },
      protocols: protocolsWithDays
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
