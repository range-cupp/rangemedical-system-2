// One-off uploader for the injection demo video to Vercel Blob.
// Run: `node scripts/upload-injection-videos.js`
// Requires BLOB_READ_WRITE_TOKEN in .env.local.

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { put, del } = require('@vercel/blob');

const VIDEOS = [
  { local: 'tmp-videos/weight-loss-injection.mp4', blob: 'injection-videos/injection.mp4' },
];

// Blob paths of any legacy videos to remove.
const STALE_BLOBS = [
  'injection-videos/b12-injection.mp4',
  'injection-videos/weight-loss-injection.mp4',
];

(async () => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Missing BLOB_READ_WRITE_TOKEN in .env.local');
    process.exit(1);
  }

  for (const v of VIDEOS) {
    const buf = fs.readFileSync(path.resolve(v.local));
    const res = await put(v.blob, buf, {
      access: 'public',
      contentType: 'video/mp4',
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(`uploaded ${v.blob}  ->  ${res.url}`);
  }

  for (const stale of STALE_BLOBS) {
    try {
      await del(`https://sixcoo3swhy8bu1g.public.blob.vercel-storage.com/${stale}`, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      console.log(`deleted ${stale}`);
    } catch (err) {
      console.warn(`skip ${stale}: ${err.message}`);
    }
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
