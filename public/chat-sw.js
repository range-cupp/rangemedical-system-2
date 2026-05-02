/* Range Medical — Team Chat PWA service worker
 * Handles Web Push notifications and click-to-focus.
 * Scoped to /chat — does not interfere with the rest of the site.
 */

const CACHE_NAME = 'range-chat-v1';

self.addEventListener('install', (event) => {
  // Activate new SW immediately on update
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Claim any open chat tabs so the new SW takes over immediately.
    await self.clients.claim();
    // Drop any old caches we might have used.
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    );
  })());
});

// Push: show a notification.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_e) {
    payload = { title: 'Range Chat', body: event.data?.text() || 'New message' };
  }

  const title = payload.title || 'Range Chat';
  const body = payload.body || '';
  const data = payload.data || {};
  const kind = data.kind;

  let tag;
  if (kind === 'patient_sms') {
    tag = data.patient_id ? `patient-sms-${data.patient_id}` : `patient-sms-${data.recipient || 'unknown'}`;
  } else {
    const channelId = data.channel_id;
    tag = channelId ? `chat-${channelId}` : 'chat';
  }

  const options = {
    body,
    tag,                 // collapse repeat notifications from the same source
    renotify: true,      // still buzz on a new message
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    data,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Click: focus an existing tab or open a new one, deep-linking to the right view.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const kind = data.kind;

  let targetUrl;
  let preferredPath;
  let postMessageData = null;

  if (kind === 'patient_sms') {
    targetUrl = data.patient_id
      ? `/admin/communications?patient=${data.patient_id}`
      : '/admin/communications';
    preferredPath = '/admin/communications';
    postMessageData = { type: 'open-patient-sms', patient_id: data.patient_id || null, recipient: data.recipient || null };
  } else {
    const channelId = data.channel_id;
    targetUrl = channelId ? `/chat?c=${channelId}` : '/chat';
    preferredPath = '/chat';
    postMessageData = { type: 'open-channel', channel_id: channelId || null };
  }

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Prefer an already-open admin/chat tab on the same path.
    for (const client of allClients) {
      try {
        const url = new URL(client.url);
        if (url.pathname.startsWith(preferredPath)) {
          await client.focus();
          if (postMessageData) client.postMessage(postMessageData);
          return;
        }
      } catch (_e) {}
    }
    // Fallback: focus any open admin tab so the panel can pick up the message.
    if (kind === 'patient_sms') {
      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          if (url.pathname.startsWith('/admin')) {
            await client.focus();
            if (postMessageData) client.postMessage(postMessageData);
            return;
          }
        } catch (_e) {}
      }
    }
    // Otherwise open a fresh window.
    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});
