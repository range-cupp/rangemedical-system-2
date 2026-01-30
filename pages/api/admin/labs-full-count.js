// /pages/api/admin/labs-full-count.js
// Get full counts of all lab-related data

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
    // Count all labs
    const { count: labsTotal } = await supabase
      .from('labs')
      .select('*', { count: 'exact', head: true });

    const { count: labsLinked } = await supabase
      .from('labs')
      .select('*', { count: 'exact', head: true })
      .not('patient_id', 'is', null);

    const { count: labsUnlinked } = await supabase
      .from('labs')
      .select('*', { count: 'exact', head: true })
      .is('patient_id', null);

    // Get unlinked labs details
    const { data: unlinkedLabs } = await supabase
      .from('labs')
      .select('id, notes, test_date, lab_provider, pdf_url')
      .is('patient_id', null)
      .limit(50);

    // Count lab_documents
    const { count: docsTotal } = await supabase
      .from('lab_documents')
      .select('*', { count: 'exact', head: true });

    const { count: docsLinked } = await supabase
      .from('lab_documents')
      .select('*', { count: 'exact', head: true })
      .not('patient_id', 'is', null);

    // Get unlinked lab documents
    const { data: unlinkedDocs } = await supabase
      .from('lab_documents')
      .select('*')
      .is('patient_id', null)
      .limit(50);

    // List files in storage bucket
    let storageFiles = [];
    try {
      const { data: topLevel } = await supabase.storage
        .from('lab-documents')
        .list('', { limit: 100 });

      for (const item of topLevel || []) {
        if (item.id === null) {
          // Folder - list contents
          const { data: subFiles } = await supabase.storage
            .from('lab-documents')
            .list(item.name, { limit: 100 });

          for (const file of subFiles || []) {
            if (file.id !== null) {
              storageFiles.push({
                path: `${item.name}/${file.name}`,
                name: file.name,
                folder: item.name
              });
            }
          }
        } else {
          storageFiles.push({
            path: item.name,
            name: item.name,
            folder: null
          });
        }
      }
    } catch (e) {
      console.error('Storage error:', e);
    }

    // Get all file paths from lab_documents table
    const { data: dbPaths } = await supabase
      .from('lab_documents')
      .select('file_path');

    const dbPathSet = new Set((dbPaths || []).map(d => d.file_path));
    const filesNotInDb = storageFiles.filter(f => !dbPathSet.has(f.path));

    return res.status(200).json({
      labs: {
        total: labsTotal,
        linked: labsLinked,
        unlinked: labsUnlinked,
        unlinked_details: unlinkedLabs
      },
      lab_documents: {
        total: docsTotal,
        linked: docsLinked,
        unlinked: docsTotal - docsLinked,
        unlinked_details: unlinkedDocs
      },
      storage: {
        total_files: storageFiles.length,
        files_in_database: storageFiles.length - filesNotInDb.length,
        files_not_in_database: filesNotInDb.length,
        orphaned_files: filesNotInDb
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
