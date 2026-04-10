// /pages/api/protocols/add-completed.js
// Add a completed protocol for a patient (for historical data entry)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { createProtocol } from '../../../lib/create-protocol';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patientId,
      templateId,
      peptideId,
      selectedDose,
      medication,
      frequency,
      startDate,
      endDate,
      notes,
      deliveryMethod,
      isWeightLoss,
      wlDuration
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'Patient is required' });
    }

    // For non-weight-loss, template is required
    if (!isWeightLoss && !templateId) {
      return res.status(400).json({ error: 'Template is required' });
    }

    let programName = '';
    let programType = '';
    let calculatedEndDate = endDate || null;

    if (isWeightLoss) {
      // Weight Loss Protocol - no template needed
      const durationLabel = wlDuration === 7 ? 'Weekly' : wlDuration === 14 ? 'Two Weeks' : 'Monthly';
      programName = `Weight Loss - ${durationLabel}`;
      programType = 'weight_loss';
      
      // Calculate end date if not provided
      if (!calculatedEndDate && startDate && wlDuration) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + wlDuration);
        calculatedEndDate = start.toISOString().split('T')[0];
      }
    } else {
      // Get template info
      const { data: template } = await supabase
        .from('protocol_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (!template) {
        return res.status(400).json({ error: 'Template not found' });
      }
      
      programName = template.name;
      programType = template.category;

      // Calculate end date from template if not provided
      if (!calculatedEndDate && template.duration_days && startDate) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + template.duration_days);
        calculatedEndDate = start.toISOString().split('T')[0];
      }
    }

    // Get peptide info if provided
    let medicationName = medication || null;
    if (!medicationName && peptideId) {
      const { data: peptide } = await supabase
        .from('peptides')
        .select('name')
        .eq('id', peptideId)
        .single();
      medicationName = peptide?.name;
    }

    // Create the protocol as completed via centralized function
    const result = await createProtocol({
      patient_id: patientId,
      program_name: programName,
      program_type: programType,
      medication: medicationName,
      selected_dose: selectedDose || null,
      frequency: frequency || null,
      delivery_method: deliveryMethod || null,
      start_date: startDate || null,
      end_date: calculatedEndDate,
      status: 'completed',
      notes,
    }, {
      source: 'add-completed',
      skipDuplicateCheck: true, // historical entries don't need duplicate checks
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    res.status(200).json({
      success: true,
      protocol: result.protocol,
      message: `Completed protocol added: ${programName}`
    });

  } catch (error) {
    console.error('Error adding completed protocol:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
}
