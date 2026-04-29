// /lib/web-push.js
// Web Push helper — sends notifications to all of an employee's registered devices.
// Stale/expired subscriptions (404/410) are deleted automatically.

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let vapidConfigured = false;
function configure() {
  if (vapidConfigured) return;
  // Trim — env vars set via `echo … | vercel env add` get a trailing
  // newline baked in, which makes the keys invalid base64url and breaks
  // setVapidDetails(). Belt-and-suspenders so future re-sets don't bite.
  const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
  const priv = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = (process.env.VAPID_SUBJECT || 'mailto:cupp@range-medical.com').trim();
  if (!pub || !priv) {
    throw new Error('VAPID keys missing — set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY');
  }
  webpush.setVapidDetails(subject, pub, priv);
  vapidConfigured = true;
}

/**
 * Send a push notification to all devices registered for one or more employees.
 * Silently logs and continues on errors so a chat send never fails because of push.
 *
 * @param {string[]} employeeIds
 * @param {object} payload  { title, body, data: { channel_id, sender_name, ... } }
 */
export async function pushToEmployees(employeeIds, payload) {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) return;

  try {
    configure();
  } catch (err) {
    console.warn('[web-push] not configured, skipping:', err.message);
    return;
  }

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, employee_id')
    .in('employee_id', employeeIds);

  if (error) {
    console.error('[web-push] fetch subs failed:', error);
    return;
  }
  if (!subs || subs.length === 0) return;

  const body = JSON.stringify(payload);
  const deadIds = [];

  await Promise.all(subs.map(async (s) => {
    const sub = {
      endpoint: s.endpoint,
      keys: { p256dh: s.p256dh, auth: s.auth },
    };
    try {
      await webpush.sendNotification(sub, body, {
        TTL: 60 * 60 * 24, // keep one day if device offline
        urgency: 'high',
      });
      // Update last_used_at — fire-and-forget
      supabase.from('push_subscriptions')
        .update({ last_used_at: new Date().toISOString(), failure_count: 0 })
        .eq('id', s.id)
        .then(() => {});
    } catch (err) {
      const status = err?.statusCode;
      if (status === 404 || status === 410) {
        // Subscription is gone (uninstalled / permission revoked) — delete it.
        deadIds.push(s.id);
      } else {
        console.warn('[web-push] send failed', status, err?.body || err?.message);
        supabase.from('push_subscriptions')
          .update({ failure_count: (s.failure_count || 0) + 1 })
          .eq('id', s.id)
          .then(() => {});
      }
    }
  }));

  if (deadIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', deadIds);
  }
}
