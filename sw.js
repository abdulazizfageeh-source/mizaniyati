/* ميزانيتي — يحفظ ملفات الأداة على الجهاز لتعمل دون إنترنت.
   عند تعديل أي ملف: غيّر رقم الإصدار هنا ليحصل الجهاز على النسخة الجديدة. */
const CACHE = 'mizaniyati-v1.1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('mizaniyati-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* من الذاكرة أولًا (يفتح فورًا ودون إنترنت)، ثم تحديث النسخة المحفوظة في الخلفية عند توفر الاتصال */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate';
  const key = isPage ? './index.html' : req;
  const network = fetch(req).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
    return res;
  }).catch(() => null);
  e.waitUntil(network.then(() => undefined));
  e.respondWith(
    caches.match(key, {ignoreSearch: true}).then(hit => hit || network.then(res => res || caches.match('./index.html')))
      .then(res => res || new Response('غير متصل', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}}))
  );
});
