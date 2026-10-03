// ============================================================
// ULTRA HUKUK AI — Progressive Web App (PWA) Service Worker v3.0
// Çevrimdışı Çalışma, Akıllı Önbellekleme & Adli Push Bildirim Dinleyicisi
// ============================================================

const CACHE_NAME = 'ultra-hukuk-cache-v3.0.0';
const OFFLINE_FALLBACK_URL = '/index.html';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/UltraHukuk.ico'
];

// 1. Kurulum (Install) — Temel Kabuk Dosyalarını Önbelleğe Al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA ServiceWorker] 📦 Temel kabuk ve statik varlıklar önbelleğe alınıyor...');
      return cache.addAll(STATIC_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Etkinleştirme (Activate) — Eski Önbellek Sürümlerini Temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`[PWA ServiceWorker] 🗑️ Eski önbellek siliniyor: ${name}`);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. İstek Yönetimi (Fetch) — Ağ Öncelikli ve Önbellek Stratejileri
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API veya WebSocket çağrıları: Doğrudan ağa git
  if (url.pathname.startsWith('/api/') || request.url.startsWith('ws://') || request.url.startsWith('wss://')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ success: false, offline: true, message: 'İnternet bağlantınız bulunmuyor. Yerel önbellek modu aktif.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Sayfa Gezinmeleri (HTML Document): Network-First, arıza durumunda Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_FALLBACK_URL).then((res) => res || fetch(request)))
    );
    return;
  }

  // Statik varlıklar (JS, CSS, Font, Görsel): Cache-First stratejisi
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf|eot)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdnjs.cloudflare.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // Diğer tüm istekler: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// 4. Web Push Bildirim Dinleyicisi (Duruşma ve Süre Alarmları)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Ultra Hukuk AI — Adli Süre Bildirimi',
    body: 'Yeni bir dava gelişmesi veya yaklaşan duruşma celseniz bulunmaktadır.',
    url: '/',
    icon: '/UltraHukuk.ico',
    badge: '/UltraHukuk.ico'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/UltraHukuk.ico',
    badge: data.badge || '/UltraHukuk.ico',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open_case', title: 'Dosyayı İncele' },
      { action: 'dismiss', title: 'Kapat' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Bildirime Tıklama (Notification Click)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
