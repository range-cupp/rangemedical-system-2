// /lib/meta-capi.js
// Meta Conversions API (CAPI) — server-side event tracking
//
// Why this exists: browser-side Meta Pixel events get blocked or dropped by
// iOS 14+ tracking limits, ad blockers, and ITP. The Conversions API sends
// the same events server-to-server so Meta can still optimize and attribute.
//
// Dedup: events sent here use the same `event_id` as the matching browser
// `fbq('track', name, data, { eventID })` call. Meta dedupes when the
// pair of (event_name, event_id) matches within 48h.
//
// Setup (one-time, in Meta Events Manager → your pixel → Settings → CAPI):
//   1. Generate an access token. Copy it.
//   2. In Vercel project settings → Environment Variables, add:
//        META_PIXEL_ID            = 4295373617400545
//        META_CAPI_ACCESS_TOKEN   = <token from step 1>
//        META_CAPI_TEST_EVENT_CODE = <optional, e.g. TEST12345 — only set
//                                    while validating in Test Events tab,
//                                    then remove for production>

import crypto from 'crypto';

const GRAPH_API_VERSION = 'v21.0';

function sha256(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return crypto
    .createHash('sha256')
    .update(String(value).toLowerCase().trim())
    .digest('hex');
}

function normalizePhone(phone) {
  if (!phone) return undefined;
  // Meta wants digits only, country code included, no leading +
  return String(phone).replace(/\D/g, '');
}

function pickFirst(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/**
 * Send one event to Meta's Conversions API.
 *
 * @param {object} opts
 * @param {string} opts.eventName       e.g. 'Purchase', 'Lead', 'InitiateCheckout'
 * @param {string} opts.eventId         dedup id — must match the browser pixel call
 * @param {string} opts.eventSourceUrl  full URL the user was on (e.g. /assessment)
 * @param {object} opts.user            { email, phone, firstName, lastName, fbp, fbc, clientIp, clientUserAgent, fbclid }
 * @param {object} [opts.custom]        custom_data: { value, currency, content_name, ... }
 * @param {number} [opts.eventTime]     unix seconds; defaults to now
 * @returns {Promise<{ ok: boolean, response?: object, error?: string, skipped?: string }>}
 */
export async function sendMetaCapiEvent({
  eventName,
  eventId,
  eventSourceUrl,
  user = {},
  custom = {},
  eventTime,
}) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE;

  if (!pixelId || !accessToken) {
    return { ok: false, skipped: 'META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not configured' };
  }

  // Build user_data — Meta requires at least one identifier (email, phone, fbp, etc.)
  const userData = {
    em: sha256(user.email),
    ph: sha256(normalizePhone(user.phone)),
    fn: sha256(user.firstName),
    ln: sha256(user.lastName),
    fbp: user.fbp || undefined,
    fbc: user.fbc || undefined,
    client_ip_address: user.clientIp || undefined,
    client_user_agent: user.clientUserAgent || undefined,
  };

  // Strip undefined keys
  Object.keys(userData).forEach((k) => userData[k] === undefined && delete userData[k]);

  if (Object.keys(userData).length === 0) {
    return { ok: false, skipped: 'no user identifiers available — Meta would reject' };
  }

  const eventPayload = {
    event_name: eventName,
    event_time: eventTime || Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
  };

  if (custom && Object.keys(custom).length > 0) {
    eventPayload.custom_data = custom;
  }

  const body = {
    data: [eventPayload],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
    accessToken
  )}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const responseJson = await res.json();
    if (!res.ok) {
      console.error('Meta CAPI error:', res.status, JSON.stringify(responseJson));
      return { ok: false, error: responseJson?.error?.message || `HTTP ${res.status}`, response: responseJson };
    }
    return { ok: true, response: responseJson };
  } catch (err) {
    console.error('Meta CAPI fetch threw:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Pull the client IP from a Next.js request, accounting for Vercel's proxy headers.
 */
export function getClientIp(req) {
  return pickFirst(
    req.headers['x-real-ip'],
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim(),
    req.socket?.remoteAddress
  );
}
