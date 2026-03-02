// /pages/api/admin/backfill-patient-tags.js
// Backfill patient tags from assessment_leads data
// Tags patients with: research-lead, assessment-injury, assessment-energy, etc.
// Also tags patients who have active protocols with their protocol type
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const results = { checked: 0, tagged: 0, details: [] };

  try {
    // 1. Get all patients
    const { data: patients, error: pErr } = await supabase
      .from('patients')
      .select('id, email, name, tags')
      .order('created_at', { ascending: false });

    if (pErr) throw pErr;

    // 2. Get all assessment leads for tag data
    const { data: leads } = await supabase
      .from('assessment_leads')
      .select('email, assessment_path, tags, intake_status');

    // Build lead lookup by email
    const leadsByEmail = {};
    for (const lead of (leads || [])) {
      const email = (lead.email || '').toLowerCase().trim();
      if (email) {
        if (!leadsByEmail[email]) leadsByEmail[email] = [];
        leadsByEmail[email].push(lead);
      }
    }

    // 3. Get active protocols for protocol-based tags
    const { data: protocols } = await supabase
      .from('patient_protocols')
      .select('patient_id, protocol_type, status');

    const protocolsByPatient = {};
    for (const proto of (protocols || [])) {
      if (!protocolsByPatient[proto.patient_id]) protocolsByPatient[proto.patient_id] = [];
      protocolsByPatient[proto.patient_id].push(proto);
    }

    // 4. Process each patient
    for (const patient of patients) {
      results.checked++;
      const existingTags = Array.isArray(patient.tags) ? patient.tags : [];
      const newTags = new Set(existingTags);

      // Tags from assessment leads
      const email = (patient.email || '').toLowerCase().trim();
      const patientLeads = leadsByEmail[email] || [];

      for (const lead of patientLeads) {
        newTags.add('research-lead');
        if (lead.assessment_path) {
          newTags.add(`assessment-${lead.assessment_path}`);
        }
        if (lead.intake_status === 'completed') {
          newTags.add('intake-completed');
        }
      }

      // Tags from protocols
      const patientProtocols = protocolsByPatient[patient.id] || [];
      for (const proto of patientProtocols) {
        if (proto.protocol_type) {
          const typeTag = proto.protocol_type.toLowerCase().replace(/[\s_]+/g, '-');
          newTags.add(typeTag);
        }
        if (proto.status === 'active') {
          newTags.add('active-patient');
        }
      }

      // Only update if tags changed
      const finalTags = [...newTags];
      if (finalTags.length > existingTags.length || finalTags.some(t => !existingTags.includes(t))) {
        const { error: updateErr } = await supabase
          .from('patients')
          .update({ tags: finalTags })
          .eq('id', patient.id);

        if (updateErr) {
          results.details.push(`Error updating ${patient.name}: ${updateErr.message}`);
        } else {
          results.tagged++;
          const addedTags = finalTags.filter(t => !existingTags.includes(t));
          results.details.push(`${patient.name}: +${addedTags.join(', ')}`);
        }
      }
    }

    return res.status(200).json({ success: true, ...results });
  } catch (error) {
    return res.status(500).json({ error: error.message, ...results });
  }
}
