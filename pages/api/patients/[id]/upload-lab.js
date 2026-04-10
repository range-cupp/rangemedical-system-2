// /pages/api/patients/[id]/upload-lab.js
// Upload lab PDF for a patient - No external dependencies version

import { createClient } from '@supabase/supabase-js';
import { HRT_PROGRAM_TYPES } from '../../../../lib/protocol-config';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: patientId } = req.query;

  if (!patientId) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    const { fileData, fileName, labType, panelType, collectionDate, notes } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'File data and name are required' });
    }

    // Convert base64 to buffer
    const base64Data = fileData.replace(/^data:application\/pdf;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${patientId}/${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lab-documents')
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
    }

    // Create database record
    const { data: docRecord, error: dbError } = await supabase
      .from('lab_documents')
      .insert({
        patient_id: patientId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileBuffer.length,
        lab_type: labType || 'Baseline',
        panel_type: panelType || null,
        collection_date: collectionDate || null,
        notes: notes || null,
        uploaded_by: 'staff',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('lab-documents').remove([filePath]);
      return res.status(500).json({ error: 'Failed to save document record', details: dbError.message });
    }

    // Auto-advance lab pipeline: if patient has a lab protocol at awaiting_results, move to uploaded
    try {
      const { data: labProto } = await supabase
        .from('protocols')
        .select('id, program_name')
        .eq('patient_id', patientId)
        .eq('program_type', 'labs')
        .in('status', ['awaiting_results', 'blood_draw_complete'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (labProto) {
        await supabase
          .from('protocols')
          .update({ status: 'uploaded', updated_at: new Date().toISOString() })
          .eq('id', labProto.id);
        console.log(`✓ Lab pipeline auto-advanced to uploaded: patient ${patientId}, protocol ${labProto.id}`);
      }
    } catch (pipelineErr) {
      // Non-fatal — don't block the upload response
      console.error('Lab pipeline auto-advance error (non-fatal):', pipelineErr);
    }

    // Auto-log blood draw for HRT protocol so patient is removed from "Due for Labs" list
    try {
      const { data: hrtProtos } = await supabase
        .from('protocols')
        .select('id, start_date, first_followup_weeks')
        .eq('patient_id', patientId)
        .in('program_type', HRT_PROGRAM_TYPES)
        .in('status', ['active', 'completed']);

      if (hrtProtos && hrtProtos.length > 0) {
        const hrtProto = hrtProtos[0];
        const startDate = new Date(hrtProto.start_date + 'T00:00:00');
        const firstWeeks = hrtProto.first_followup_weeks || 8;
        const today = new Date();

        // Build the lab schedule
        const schedule = [];
        schedule.push({ weeks: firstWeeks, label: `${firstWeeks}-Week Labs` });
        for (let w = firstWeeks + 12; w <= 104; w += 12) {
          schedule.push({ weeks: w, label: `${w}-Week Labs` });
        }

        // Get existing blood draw logs
        const { data: existingLogs } = await supabase
          .from('protocol_logs')
          .select('notes')
          .eq('protocol_id', hrtProto.id)
          .eq('log_type', 'blood_draw');

        const loggedLabels = new Set((existingLogs || []).map(l => l.notes));

        // Find the next unlogged draw that's due (within -30 to +30 days of today)
        for (const entry of schedule) {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + entry.weeks * 7);

          const alreadyLogged = loggedLabels.has(entry.label) || loggedLabels.has(entry.label.replace('-Week', ' Week'));

          if (!alreadyLogged) {
            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            if (daysDiff >= -30 && daysDiff <= 30) {
              await supabase.from('protocol_logs').insert({
                protocol_id: hrtProto.id,
                patient_id: patientId,
                log_type: 'blood_draw',
                log_date: collectionDate || new Date().toISOString().split('T')[0],
                notes: entry.label
              });
              console.log(`✓ Auto-logged blood draw for HRT protocol ${hrtProto.id}: ${entry.label}`);
              break;
            }
          }
        }
      }
    } catch (hrtLogErr) {
      // Non-fatal — don't block the upload response
      console.error('HRT blood draw auto-log error (non-fatal):', hrtLogErr);
    }

    return res.status(200).json({
      success: true,
      document: docRecord,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
