const CACHE_NAME = "bs-erp-v8";
const ASSETS = ['./', './index.html', './pages/dashboard.html', './css/style.css', './js/app.js', './js/auth.js', './js/supabase-config.js', './logo_black.png', './logo_white.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });