// /pages/api/admin/journeys/board.js
// Journey Board API - returns patients grouped by stage for Kanban view
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { protocol_type, template_id } = req.query;

  if (!protocol_type) {
    return res.status(400).json({ error: 'protocol_type is required' });
  }

  try {
    // 1. Get the journey template (default or specified)
    let templateQuery = supabase
      .from('journey_templates')
      .select('*')
      .eq('protocol_type', protocol_type);

    if (template_id) {
      templateQuery = templateQuery.eq('id', template_id);
    } else {
      templateQuery = templateQuery.eq('is_default', true);
    }

    const { data: template } = await templateQuery.single();

    if (!template) {
      return res.status(404).json({ error: `No journey template found for ${protocol_type}` });
    }

    // 2. Get all active/paused protocols of this type
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id, patient_id, program_name, program_type, medication, selected_dose,
        frequency, status, start_date, end_date, current_journey_stage,
        journey_template_id, sessions_used, total_sessions, created_at,
        patients!inner(id, name, first_name, last_name, email, phone)
      `)
      .eq('program_type', protocol_type)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false });

    if (protocolsError) {
      return res.status(500).json({ error: protocolsError.message });
    }

    // 3. Group protocols by stage
    const stages = template.stages || [];
    const stageKeys = stages.map(s => s.key);
    const board = {};

    // Initialize all stage columns
    for (const stage of stages) {
      board[stage.key] = {
        key: stage.key,
        label: stage.label,
        description: stage.description || '',
        order: stage.order,
        patients: []
      };
    }

    // Add "unassigned" column for protocols without a stage
    board['_unassigned'] = {
      key: '_unassigned',
      label: 'Unassigned',
      description: 'Protocols not yet placed on the journey board',
      order: -1,
      patients: []
    };

    // Place protocols into columns
    for (const protocol of (protocols || [])) {
      const stageKey = protocol.current_journey_stage;
      const patientName = protocol.patients?.first_name && protocol.patients?.last_name
        ? `${protocol.patients.first_name} ${protocol.patients.last_name}`
        : protocol.patients?.name || 'Unknown';

      const card = {
        protocolId: protocol.id,
        patientId: protocol.patient_id,
        patientName,
        patientEmail: protocol.patients?.email,
        patientPhone: protocol.patients?.phone,
        programName: protocol.program_name,
        medication: protocol.medication,
        dose: protocol.selected_dose,
        frequency: protocol.frequency,
        status: protocol.status,
        startDate: protocol.start_date,
        sessionsUsed: protocol.sessions_used,
        totalSessions: protocol.total_sessions,
        currentStage: stageKey,
        createdAt: protocol.created_at
      };

      if (stageKey && board[stageKey]) {
        board[stageKey].patients.push(card);
      } else {
        board['_unassigned'].patients.push(card);
      }
    }

    // Convert to array sorted by order
    const columns = Object.values(board).sort((a, b) => a.order - b.order);

    // Get counts summary
    const totalPatients = protocols?.length || 0;
    const assignedPatients = totalPatients - (board['_unassigned']?.patients?.length || 0);

    return res.status(200).json({
      template,
      columns,
      summary: {
        totalPatients,
        assignedPatients,
        unassigned: totalPatients - assignedPatients
      }
    });

  } catch (error) {
    console.error('Journey board error:', error);
    return res.status(500).json({ error: error.message });
  }
}
