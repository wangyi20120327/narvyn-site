/* Narvyn site service worker
   - precache 核心外壳
   - /assets/* 走 cache-first（内容不变，文件名带版本时自然更新）
   - 导航与 update.json 走 network-first；update.json 永不缓存
   - skipWaiting + clients.claim；activate 清理旧缓存
   */
const CACHE_NAME = 'narvyn-site-v1';

const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './assets/js/gsap.min.js',
  './assets/js/ScrollTrigger.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key.startsWith('narvyn-site-'))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // update.json：永远直连网络，绝不缓存（App 检查更新必须拿到最新版）
  if (url.pathname.endsWith('/update.json')) {
    event.respondWith(fetch(request));
    return;
  }

  // 页面导航：network-first，失败回退缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match('./index.html'))
        )
    );
    return;
  }

  // 静态资源：cache-first
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
