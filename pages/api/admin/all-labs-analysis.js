// /pages/api/admin/all-labs-analysis.js
// Analyze all lab-related tables

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check labs table
    const { data: labs, error: labsError } = await supabase
      .from('labs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // Check patient_labs table
    const { data: patientLabs, error: patientLabsError } = await supabase
      .from('patient_labs')
      .select('*')
      .order('collection_date', { ascending: false })
      .limit(100);

    // Check lab_documents table
    const { data: labDocuments, error: labDocsError } = await supabase
      .from('lab_documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // Check lab_orders table
    const { data: labOrders, error: labOrdersError } = await supabase
      .from('lab_orders')
      .select('*')
      .order('order_date', { ascending: false })
      .limit(100);

    // Analyze labs table
    const labsLinked = labs?.filter(l => l.patient_id)?.length || 0;
    const labsUnlinked = (labs?.length || 0) - labsLinked;
    const labsFields = labs?.[0] ? Object.keys(labs[0]) : [];

    // Analyze patient_labs table
    const patientLabsLinked = patientLabs?.filter(l => l.patient_id)?.length || 0;
    const patientLabsUnlinked = (patientLabs?.length || 0) - patientLabsLinked;

    return res.status(200).json({
      labs_table: {
        count: labs?.length || 0,
        linked: labsLinked,
        unlinked: labsUnlinked,
        error: labsError?.message,
        fields: labsFields,
        sample: labs?.[0],
        unlinked_samples: labs?.filter(l => !l.patient_id)?.slice(0, 10)
      },
      patient_labs_table: {
        count: patientLabs?.length || 0,
        linked: patientLabsLinked,
        unlinked: patientLabsUnlinked,
        error: patientLabsError?.message,
        fields: patientLabs?.[0] ? Object.keys(patientLabs[0]) : [],
        sample: patientLabs?.[0]
      },
      lab_documents_table: {
        count: labDocuments?.length || 0,
        error: labDocsError?.message,
        fields: labDocuments?.[0] ? Object.keys(labDocuments[0]) : [],
        samples: labDocuments?.slice(0, 5)
      },
      lab_orders_table: {
        count: labOrders?.length || 0,
        error: labOrdersError?.message,
        fields: labOrders?.[0] ? Object.keys(labOrders[0]) : [],
        sample: labOrders?.[0]
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
