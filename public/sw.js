// Self-destructing service worker
// Clears all caches and unregisters itself so stale precache manifests
// never block the app after a new deployment.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', async () => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => client.navigate(client.url));
  await self.registration.unregister();
});
