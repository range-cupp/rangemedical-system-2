// /pages/api/admin/storage-lab-files.js
// List all files in the lab-documents storage bucket

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
    // List all files in the lab-documents bucket
    const { data: files, error } = await supabase.storage
      .from('lab-documents')
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      return res.status(500).json({ error: 'Failed to list files', details: error.message });
    }

    // Get database records for comparison
    const { data: dbRecords } = await supabase
      .from('lab_documents')
      .select('file_path, patient_id, file_name');

    const dbPaths = new Set((dbRecords || []).map(r => r.file_path));

    // Also list files in subdirectories (patient_id folders)
    const allFiles = [];

    // First level might be folders (patient IDs) or files
    for (const item of files || []) {
      if (item.id === null) {
        // This is a folder, list its contents
        const { data: subFiles } = await supabase.storage
          .from('lab-documents')
          .list(item.name, { limit: 1000 });

        for (const subFile of subFiles || []) {
          if (subFile.id !== null) {
            const fullPath = `${item.name}/${subFile.name}`;
            allFiles.push({
              name: subFile.name,
              path: fullPath,
              size: subFile.metadata?.size,
              created_at: subFile.created_at,
              folder: item.name,
              in_database: dbPaths.has(fullPath)
            });
          }
        }
      } else {
        // This is a file at root level
        allFiles.push({
          name: item.name,
          path: item.name,
          size: item.metadata?.size,
          created_at: item.created_at,
          folder: null,
          in_database: dbPaths.has(item.name)
        });
      }
    }

    const filesInDb = allFiles.filter(f => f.in_database).length;
    const filesNotInDb = allFiles.filter(f => !f.in_database).length;

    return res.status(200).json({
      summary: {
        total_storage_files: allFiles.length,
        files_in_database: filesInDb,
        files_not_in_database: filesNotInDb,
        database_records: dbRecords?.length || 0
      },
      files_not_in_database: allFiles.filter(f => !f.in_database),
      all_files: allFiles,
      top_level_items: files
    });

  } catch (error) {
    console.error('Storage list error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
