// lib/meta-pixel-client.js
// Browser-side helpers for Meta Pixel + CAPI deduplication.
//
// Pattern:
//   const eventId = newMetaEventId('lead');
//   const meta = readMetaAttribution();
//   fbq('track', 'Lead', { value: 85, currency: 'USD' }, { eventID: eventId });
//   await fetch('/api/...', { body: JSON.stringify({ ..., meta: { eventId, ...meta } }) });
// The server fires the same event to CAPI with the same eventId — Meta dedupes.

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Read Meta attribution signals from the browser:
 *   _fbp     — first-party pixel cookie set by fbq('init')
 *   _fbc     — click cookie set when user arrives via ?fbclid=...
 *   fbclid   — raw click id from current URL (helps if _fbc cookie is missing)
 */
export function readMetaAttribution() {
  const fbp = readCookie('_fbp');
  let fbc = readCookie('_fbc');
  let fbclid = null;

  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      fbclid = params.get('fbclid');
      if (!fbc && fbclid) {
        // Synthesize the same format Pixel would write to _fbc itself.
        fbc = `fb.1.${Date.now()}.${fbclid}`;
      }
    } catch {}
  }

  return { fbp, fbc, fbclid };
}

/**
 * Generate a stable event id for one (event_name, user-action) pair so the
 * browser pixel and the server CAPI event can be deduplicated by Meta.
 */
export function newMetaEventId(prefix = 'evt') {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}
