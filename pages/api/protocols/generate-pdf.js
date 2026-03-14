// /pages/api/protocols/generate-pdf.js
// POST — Generates a protocol PDF for a patient
// Body: { patient_id, patient_name, protocols[], combine, store }
//
// If store=false (default): returns PDF inline (Content-Type: application/pdf)
// If store=true: uploads to Supabase storage + saves to medical_documents → returns URL

import { createClient } from '@supabase/supabase-js';
import { generateProtocolPdf } from '../../../lib/protocol-pdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fetch or generate cached peptide content
async function fetchPeptideContent(peptideNames) {
  if (!peptideNames || peptideNames.length === 0) return {};

  // Try to fetch from cache first
  const { data: existing } = await supabase
    .from('peptide_content')
    .select('*')
    .in('peptide_name', peptideNames);

  const cachedMap = {};
  for (const row of (existing || [])) {
    cachedMap[row.peptide_name] = {
      description: row.description,
      phase_goals: row.phase_goals || [],
      what_to_expect: row.what_to_expect || [],
      storage_instructions: row.storage_instructions || '',
    };
  }

  // For missing peptides, call the peptide-content API to auto-generate
  const missing = peptideNames.filter(name => !cachedMap[name]);
  if (missing.length > 0) {
    try {
      // Call our own API endpoint to generate missing content
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/protocols/peptide-content?peptides=${encodeURIComponent(missing.join(','))}`);
      if (response.ok) {
        const { content } = await response.json();
        for (const name of missing) {
          if (content[name]) {
            cachedMap[name] = content[name];
          }
        }
      }
    } catch (err) {
      console.error('Failed to auto-generate peptide content:', err.message);
      // Provide fallback content for missing peptides
      for (const name of missing) {
        if (!cachedMap[name]) {
          cachedMap[name] = {
            description: `${name} is a peptide used in regenerative medicine protocols at Range Medical.`,
            phase_goals: [],
            what_to_expect: [],
            storage_instructions: 'Refrigerate pre-filled syringes between 36-46 degrees F. Do not freeze.',
          };
        }
      }
    }
  }

  return cachedMap;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, patient_name, protocols, combine = true, store = false } = req.body;

  if (!protocols || !Array.isArray(protocols) || protocols.length === 0) {
    return res.status(400).json({ error: 'protocols array is required' });
  }

  if (!patient_name) {
    return res.status(400).json({ error: 'patient_name is required' });
  }

  try {
    // 1. Extract unique peptide names
    const peptideNames = [...new Set(protocols.map(p => p.medication).filter(Boolean))];

    // 2. Fetch/generate cached content
    const cachedContent = await fetchPeptideContent(peptideNames);

    // 3. Generate the PDF
    const pdfBytes = await generateProtocolPdf({
      patientName: patient_name,
      protocols,
      combineSingleDoc: combine,
      cachedContent,
    });

    // 4. Return inline or store
    if (!store) {
      // Return PDF directly
      const buffer = Buffer.from(pdfBytes);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="protocol-${patient_name.replace(/\s+/g, '-')}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      return res.status(200).send(buffer);
    }

    // Store mode: upload to Supabase storage + save medical_documents record
    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required when store=true' });
    }

    const timestamp = Date.now();
    const safeName = patient_name.replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `protocol-pdfs/${patient_id}/${safeName}-${timestamp}.pdf`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('medical-documents')
      .upload(fileName, Buffer.from(pdfBytes), {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload PDF', detail: uploadError.message });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('medical-documents')
      .getPublicUrl(fileName);

    // Save to medical_documents table
    const protocolNames = protocols.map(p => p.medication).filter(Boolean).join(', ');
    const docName = protocols.length > 1
      ? `Protocol Plan — ${protocolNames}`
      : `${protocols[0]?.medication || 'Protocol'} Protocol`;

    const { error: docError } = await supabase
      .from('medical_documents')
      .insert({
        patient_id,
        document_name: docName,
        document_url: publicUrl,
        document_type: 'protocol_pdf',
        notes: `Generated protocol PDF for ${protocolNames}`,
        uploaded_by: 'system',
      });

    if (docError) {
      console.error('Document record error:', docError);
      // PDF is uploaded, just failed to create the record — still return success
    }

    return res.status(200).json({
      success: true,
      pdf_url: publicUrl,
      document_name: docName,
      stored: true,
    });

  } catch (error) {
    console.error('Protocol PDF generation error:', error);
    return res.status(500).json({ error: 'Failed to generate protocol PDF', detail: error.message });
  }
}
