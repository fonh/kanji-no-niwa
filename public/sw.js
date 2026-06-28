// Minimal service worker for PWA installability
const CACHE_NAME = 'knw-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', e => {
  // Network-first for API and auth routes; cache-first for static assets
  if (e.request.url.includes('/api/') || e.request.url.includes('/auth/')) return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
