// /pages/api/admin/backfill-assessment-documents.js
// Links existing assessment PDFs to patient medical_documents
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all assessment leads that have a PDF URL
    const { data: leads, error: leadsError } = await supabase
      .from('assessment_leads')
      .select('id, first_name, last_name, email, assessment_path, pdf_url, created_at')
      .not('pdf_url', 'is', null)
      .order('created_at', { ascending: true });

    if (leadsError) throw leadsError;

    let linked = 0;
    let alreadyLinked = 0;
    let noPatient = 0;
    const errors = [];

    for (const lead of leads) {
      if (!lead.email || !lead.pdf_url) continue;

      const normalizedEmail = lead.email.toLowerCase().trim();

      // Find patient by email
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (!patient) {
        noPatient++;
        continue;
      }

      // Check if this assessment PDF is already linked as a medical document
      const { data: existingDoc } = await supabase
        .from('medical_documents')
        .select('id')
        .eq('patient_id', patient.id)
        .eq('document_url', lead.pdf_url)
        .maybeSingle();

      if (existingDoc) {
        alreadyLinked++;
        continue;
      }

      // Create medical document record
      const pathLabel = lead.assessment_path === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization';
      const dateStr = new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      const { error: insertError } = await supabase
        .from('medical_documents')
        .insert({
          patient_id: patient.id,
          document_name: `Range Assessment — ${pathLabel} (${dateStr})`,
          document_url: lead.pdf_url,
          document_type: 'Assessment',
          notes: `Completed ${pathLabel} assessment`,
          uploaded_by: 'System'
        });

      if (insertError) {
        errors.push({ leadId: lead.id, name: `${lead.first_name} ${lead.last_name}`, error: insertError.message });
      } else {
        linked++;
        console.log(`Linked assessment PDF for ${lead.first_name} ${lead.last_name} → patient ${patient.id}`);
      }
    }

    return res.status(200).json({
      success: true,
      totalLeadsWithPdf: leads.length,
      linked,
      alreadyLinked,
      noPatient,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Backfill assessment documents error:', error);
    return res.status(500).json({ error: error.message });
  }
}
