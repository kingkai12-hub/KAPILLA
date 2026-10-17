// Self-destructing service worker.
//
// An earlier build shipped a cache-first service worker that cached the `/`
// document forever under a hard-coded cache name. After a deploy, affected
// browsers kept serving that stale document, which referenced JS chunk hashes
// that no longer exist — producing "We couldn't load this component".
//
// Nothing in the app registers a service worker anymore, but a previously
// installed copy keeps running until the browser re-checks this file. Because
// this file changed, the browser will fetch it on the next navigation and run
// the activate handler below, which unregisters the worker, clears every cache
// and reloads open tabs so they pick up a fresh document.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop every cache this origin created (including the stale document cache).
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      // Remove ourselves so no future request is served from a stale worker.
      await self.registration.unregister();

      // Reload any open tab so it fetches a fresh document + current JS chunks.
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
