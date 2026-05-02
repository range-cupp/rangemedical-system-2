// pages/api/patients/[id]/chart-pdf.js
// Generate and return a comprehensive patient chart PDF

import { createClient } from '@supabase/supabase-js';
import { generateChartPdf } from '../../../../lib/chart-pdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, sections: sectionsParam } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  // Parse comma-separated section keys; absent param = include everything
  const sections = sectionsParam
    ? Object.fromEntries(String(sectionsParam).split(',').filter(Boolean).map(k => [k.trim(), true]))
    : null;

  try {
    // Fetch all patient data in parallel
    const [
      { data: patient },
      { data: intakes },
      { data: protocols },
      { data: labs },
      { data: notes },
      { data: appointments },
      { data: serviceLogs },
      { data: consents },
      { data: prescriptions },
    ] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase.from('intakes').select('*').eq('patient_id', id).order('submitted_at', { ascending: false }),
      supabase.from('protocols').select('*').eq('patient_id', id).order('start_date', { ascending: false }),
      supabase.from('labs').select('id, test_date, lab_type, panel_type, lab_provider, status').eq('patient_id', id).order('test_date', { ascending: false }),
      supabase.from('patient_notes').select('*').eq('patient_id', id).order('note_date', { ascending: false }),
      supabase.from('appointments').select('*').eq('patient_id', id).order('start_time', { ascending: false }),
      supabase.from('service_logs').select('*').eq('patient_id', id).order('entry_date', { ascending: false }),
      supabase.from('consents').select('*').eq('patient_id', id).order('consent_date', { ascending: false }),
      supabase.from('prescriptions').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
    ]);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Also try clinic_appointments
    const { data: clinicAppts } = await supabase
      .from('clinic_appointments')
      .select('*')
      .eq('patient_id', id)
      .order('start_time', { ascending: false });

    const allAppointments = [...(appointments || []), ...(clinicAppts || [])];

    // Split protocols
    const activeProtocols = (protocols || []).filter(p => p.status === 'active');
    const completedProtocols = (protocols || []).filter(p => p.status !== 'active');

    const pdfBytes = await generateChartPdf({
      patient,
      intakes: intakes || [],
      activeProtocols,
      completedProtocols,
      labs: labs || [],
      notes: notes || [],
      appointments: allAppointments,
      serviceLogs: serviceLogs || [],
      consents: consents || [],
      prescriptions: prescriptions || [],
      sections,
    });

    const patientName = `${patient.first_name || ''}_${patient.last_name || ''}`.trim().replace(/\s+/g, '_') || 'Patient';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Chart_${patientName}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Chart PDF error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate chart PDF' });
  }
}
