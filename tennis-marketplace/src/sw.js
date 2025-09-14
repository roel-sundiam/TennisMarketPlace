// Tennis Marketplace Service Worker
// Modern PWA with advanced caching strategies

const CACHE_NAME = 'tennis-marketplace-v1.0.0';
const STATIC_CACHE_NAME = 'tennis-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'tennis-dynamic-v1.0.0';
const IMAGE_CACHE_NAME = 'tennis-images-v1.0.0';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Static assets - Cache First
  STATIC: [
    '/',
    '/browse',
    '/login',
    '/register',
    '/manifest.json',
    // Add other static routes
  ],
  
  // API responses - Network First with fallback
  API_ENDPOINTS: [
    '/api/products',
    '/api/auth',
    '/api/users'
  ],
  
  // Images - Cache First with network fallback
  IMAGES: [
    /\.(jpg|jpeg|png|gif|webp|svg)$/i
  ]
};

// Pre-cache critical resources
const PRECACHE_RESOURCES = [
  '/',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/offline.html' // We'll create this fallback page
];

// Install event - Pre-cache critical resources
self.addEventListener('install', (event) => {
  console.log('🎾 Tennis Marketplace SW: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Pre-cache critical resources
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('🎾 SW: Pre-caching critical resources');
        return cache.addAll(PRECACHE_RESOURCES);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🎾 Tennis Marketplace SW: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME && 
                     cacheName !== IMAGE_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('🎾 SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - Implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

// Main fetch handler with different strategies
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: API requests - Network First with cache fallback
    if (isApiRequest(url)) {
      return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    }
    
    // Strategy 2: Images - Cache First with network fallback
    if (isImageRequest(url)) {
      return await cacheFirstStrategy(request, IMAGE_CACHE_NAME);
    }
    
    // Strategy 3: Static assets - Cache First
    if (isStaticAsset(url)) {
      return await cacheFirstStrategy(request, STATIC_CACHE_NAME);
    }
    
    // Strategy 4: HTML pages - Stale While Revalidate
    if (isHTMLRequest(request)) {
      return await staleWhileRevalidateStrategy(request, DYNAMIC_CACHE_NAME);
    }
    
    // Default: Network First
    return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    
  } catch (error) {
    console.error('🎾 SW: Fetch error:', error);
    return await getOfflineFallback(request);
  }
}

// Network First Strategy - For API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🎾 SW: Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache First Strategy - For images and static assets
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('🎾 SW: Failed to fetch from network:', request.url);
    throw error;
  }
}

// Stale While Revalidate Strategy - For HTML pages
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });
  
  return cachedResponse || networkResponsePromise;
}

// Helper functions to determine request types
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         CACHE_STRATEGIES.API_ENDPOINTS.some(endpoint => 
           url.pathname.startsWith(endpoint)
         );
}

function isImageRequest(url) {
  return CACHE_STRATEGIES.IMAGES.some(pattern => 
    pattern.test(url.pathname)
  ) || url.pathname.includes('/images/') || 
      url.pathname.includes('/assets/');
}

function isStaticAsset(url) {
  return url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname === '/manifest.json';
}

function isHTMLRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

// Offline fallback
async function getOfflineFallback(request) {
  if (isHTMLRequest(request)) {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  if (isImageRequest(new URL(request.url))) {
    // Return a placeholder image from cache or inline SVG
    return new Response(
      '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"#f3f4f6\"/><text x=\"50%\" y=\"50%\" text-anchor=\"middle\" dy=\".3em\" fill=\"#9ca3af\">🎾 Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  throw new Error('No offline fallback available');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🎾 SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'product-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when back online
async function syncOfflineActions() {
  console.log('🎾 SW: Syncing offline actions...');
  
  // Get offline actions from IndexedDB or localStorage
  try {
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('🎾 SW: Failed to sync action:', action, error);
      }
    }
  } catch (error) {
    console.error('🎾 SW: Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('🎾 SW: Push received');
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/assets/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/assets/icons/action-dismiss.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '🎾 Tennis Marketplace', options)
    );
  } catch (error) {
    console.error('🎾 SW: Push notification error:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🎾 SW: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window/tab open
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          
          // If not, open a new window/tab
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('🎾 SW: Periodic sync triggered:', event.tag);
  
  if (event.tag === 'product-updates') {
    event.waitUntil(syncProductUpdates());
  }
});

// Helper functions for offline storage
async function getOfflineActions() {
  // Implementation would use IndexedDB
  return [];
}

async function processOfflineAction(action) {
  // Process the offline action when back online
  console.log('🎾 SW: Processing offline action:', action);
}

async function removeOfflineAction(actionId) {
  // Remove processed action from storage
  console.log('🎾 SW: Removing processed action:', actionId);
}

async function syncProductUpdates() {
  // Sync product updates in background
  console.log('🎾 SW: Syncing product updates...');
}

// Log service worker lifecycle
console.log('🎾 Tennis Marketplace Service Worker loaded successfully!');