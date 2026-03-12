// Service Worker para CEA Biométrico
const CACHE_NAME = 'cea-biometrico-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/main.css',
  '/js/app.js',
  '/assets/icons/icon-192x192.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activación - limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de cache: Network First con fallback a cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar en cache si es exitoso
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla, buscar en cache
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          // Si es página, mostrar offline.html
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-heartbeats') {
    event.waitUntil(syncHeartbeats());
  }
});

async function syncHeartbeats() {
  const db = await openIndexedDB();
  const pending = await db.getAll('pendingHeartbeats');
  
  for (const heartbeat of pending) {
    try {
      await fetch('/api/heartbeat', {
        method: 'POST',
        body: JSON.stringify(heartbeat)
      });
      await db.delete('pendingHeartbeats', heartbeat.id);
    } catch (error) {
      console.error('Error syncing heartbeat:', error);
    }
  }
}