// /pages/api/admin/list-storage-buckets.js
// List all Supabase storage buckets and their contents

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
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      return res.status(500).json({ error: 'Failed to list buckets', details: bucketsError.message });
    }

    const bucketDetails = [];

    for (const bucket of buckets || []) {
      // List files in each bucket (top level)
      const { data: files, error: filesError } = await supabase.storage
        .from(bucket.name)
        .list('', { limit: 100 });

      let fileCount = 0;
      let sampleFiles = [];

      if (!filesError && files) {
        // Count files including in subfolders
        for (const item of files) {
          if (item.id === null) {
            // It's a folder - list contents
            const { data: subFiles } = await supabase.storage
              .from(bucket.name)
              .list(item.name, { limit: 100 });

            const subFileCount = (subFiles || []).filter(f => f.id !== null).length;
            fileCount += subFileCount;

            // Add sample files from this folder
            for (const sf of (subFiles || []).filter(f => f.id !== null).slice(0, 3)) {
              sampleFiles.push(`${item.name}/${sf.name}`);
            }
          } else {
            fileCount++;
            if (sampleFiles.length < 10) {
              sampleFiles.push(item.name);
            }
          }
        }
      }

      bucketDetails.push({
        name: bucket.name,
        id: bucket.id,
        public: bucket.public,
        created_at: bucket.created_at,
        file_count: fileCount,
        top_level_items: files?.length || 0,
        sample_files: sampleFiles.slice(0, 10),
        error: filesError?.message
      });
    }

    return res.status(200).json({
      total_buckets: buckets?.length || 0,
      buckets: bucketDetails
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
