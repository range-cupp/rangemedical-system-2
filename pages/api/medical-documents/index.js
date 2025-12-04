// pages/api/medical-documents/index.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { 
        patient_id, 
        document_name, 
        document_url, 
        document_type, 
        notes,
        uploaded_by 
      } = req.body;

      // Validate required fields
      if (!patient_id || !document_name || !document_url) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: patient_id, document_name, document_url' 
        });
      }

      // Insert document record
      const { data, error } = await supabase
        .from('medical_documents')
        .insert({
          patient_id,
          document_name,
          document_url,
          document_type: document_type || 'Medical Record',
          notes: notes || null,
          uploaded_by: uploaded_by || 'Staff'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save document record',
          details: error.message 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        document: data
      });

    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const { patient_id } = req.query;

      if (!patient_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing patient_id parameter' 
        });
      }

      // Get all documents for patient
      const { data, error } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('patient_id', patient_id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch documents',
          details: error.message 
        });
      }

      return res.status(200).json({
        success: true,
        documents: data || []
      });

    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
