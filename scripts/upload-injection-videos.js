// One-off uploader for injection demo videos to Vercel Blob.
// Run: `node scripts/upload-injection-videos.js`
// Requires BLOB_READ_WRITE_TOKEN in .env.local.

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

const VIDEOS = [
  { local: 'tmp-videos/b12-injection.mp4',           blob: 'injection-videos/b12-injection.mp4' },
  { local: 'tmp-videos/weight-loss-injection.mp4',   blob: 'injection-videos/weight-loss-injection.mp4' },
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
    console.log(`${v.blob}  ->  ${res.url}`);
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
