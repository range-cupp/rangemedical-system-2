// pages/api/r/[code].js
// Short-link redirect: /api/r/{code} → fresh signed URL or stored target_url.
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// How long each generated signed URL is valid for (1 hour is plenty —
// the patient is clicking now and the URL only needs to outlive the redirect).
const SIGNED_URL_TTL_SECONDS = 3600;

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).send('Method not allowed');
  }

  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Invalid code');
  }

  try {
    const { data: link, error } = await supabase
      .from('short_links')
      .select('id, storage_bucket, storage_path, target_url, expires_at')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('short-link lookup error:', error);
      return res.status(500).send('Server error');
    }

    if (!link) {
      return res.status(404).send('Link not found');
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).send('This link has expired. Please contact Range Medical for a new one.');
    }

    let destination = null;

    if (link.storage_bucket && link.storage_path) {
      const { data: signed, error: signError } = await supabase.storage
        .from(link.storage_bucket)
        .createSignedUrl(link.storage_path, SIGNED_URL_TTL_SECONDS);

      if (signError || !signed?.signedUrl) {
        console.error('Signed URL generation error:', signError);
        return res.status(500).send('Could not generate document URL');
      }
      destination = signed.signedUrl;
    } else if (link.target_url) {
      destination = link.target_url;
    }

    if (!destination) {
      return res.status(500).send('No destination configured for this link');
    }

    // Best-effort click tracking — fire and forget.
    supabase
      .from('short_links')
      .update({ last_clicked_at: new Date().toISOString() })
      .eq('id', link.id)
      .then(() => {}, () => {});

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, destination);
  } catch (err) {
    console.error('short-link handler error:', err);
    return res.status(500).send('Server error');
  }
}
