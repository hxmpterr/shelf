// Serves stored game files to the emulator at /__rom/<id>/<name> so it sees a real URL.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
const open = () => new Promise((ok, no) => { const r = indexedDB.open('shelf', 1);
  r.onupgradeneeded = () => { r.result.createObjectStore('roms'); r.result.createObjectStore('meta'); };
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url), i = u.pathname.indexOf('/__rom/'); if (i < 0) return;
  const id = decodeURIComponent(u.pathname.slice(i + 7).split('/')[0]);
  e.respondWith((async () => {
    const d = await open();
    const b = await new Promise((ok, no) => { const q = d.transaction('roms').objectStore('roms').get(id); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); });
    return b ? new Response(b, { headers: { 'Content-Type': 'application/octet-stream' } }) : new Response('Not found', { status: 404 });
  })());
});
