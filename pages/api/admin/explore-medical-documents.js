// /pages/api/admin/explore-medical-documents.js
// Explore all folders in the medical-documents bucket

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
    // List top-level items in medical-documents bucket
    const { data: topLevel, error: topError } = await supabase.storage
      .from('medical-documents')
      .list('', { limit: 100 });

    if (topError) {
      return res.status(500).json({ error: 'Failed to list bucket', details: topError.message });
    }

    const folders = {};

    for (const item of topLevel || []) {
      if (item.id === null) {
        // It's a folder - list all contents
        const { data: files, error: filesError } = await supabase.storage
          .from('medical-documents')
          .list(item.name, { limit: 1000 });

        const fileList = (files || []).filter(f => f.id !== null);

        folders[item.name] = {
          file_count: fileList.length,
          sample_files: fileList.slice(0, 20).map(f => ({
            name: f.name,
            path: `${item.name}/${f.name}`,
            size: f.metadata?.size,
            created_at: f.created_at
          })),
          error: filesError?.message
        };
      }
    }

    // Specifically list external-labs folder in detail
    const { data: externalLabs } = await supabase.storage
      .from('medical-documents')
      .list('external-labs', { limit: 1000 });

    return res.status(200).json({
      top_level_folders: Object.keys(folders),
      folders,
      external_labs_detail: {
        count: (externalLabs || []).filter(f => f.id !== null).length,
        all_files: (externalLabs || []).filter(f => f.id !== null).map(f => ({
          name: f.name,
          path: `external-labs/${f.name}`,
          size: f.metadata?.size,
          created_at: f.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
