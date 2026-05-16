/* ============================================
   DENTAVIZION — Service Worker
   Network-first for dev, cache-first for prod
   ============================================ */

const CACHE_NAME = 'dentavizion-v7';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/pages/landing.css',
  '/css/pages/home.css',
  '/css/pages/modules.css',
  '/css/pages/module-content.css',
  '/css/pages/quiz.css',
  '/css/pages/profile.css',
  '/js/app.js',
  '/js/pwa.js',
  '/js/accessibility.js',
  '/css/pages/auth.css',
  '/pages/login.html',
  '/pages/register.html',
  '/pages/brushing-guide.html',
  '/pages/scaling-guide.html',
  '/pages/filling-guide.html',
  '/pages/extraction-guide.html',
  '/pages/quiz.html',
  '/pages/quiz-scaling.html',
  '/pages/quiz-filling.html',
  '/pages/quiz-extraction.html',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/images/mascot-tooth.png',
  '/assets/images/hero-brushing.png',
  '/assets/images/material-brushing.png',
  '/assets/images/material-food.png',
  '/assets/images/material-clinic.png'
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — network-first for HTML/CSS/JS, cache-first for images
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isAsset = url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot)$/i);

  if (isAsset) {
    // Images/fonts: cache-first (they rarely change)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      }).catch(() => {
        // Offline fallback for images
      })
    );
  } else {
    // HTML/CSS/JS: network-first (always get latest during dev)
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Offline fallback for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
    );
  }
});
