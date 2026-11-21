/* Service worker de l'appli Rajul Malik
   - index.html : on prend d'abord la version EN LIGNE (donc les mises à jour s'affichent
     tout de suite), et la copie en mémoire sert seulement quand il n'y a pas de réseau.
   - images, mp3 : copie en mémoire d'abord (hors ligne), avec gestion des requêtes "Range" (audio).
   À chaque ajout ou changement de fichiers : changer VERSION (rm-v3 -> rm-v12, etc.). */
const VERSION = "rm-v12";
const MP3 = Array.from({ length: 14 }, (_, i) => `assets/audio/track${String(i + 1).padStart(2, "0")}.mp3`);
const FILES = [
  "./", "index.html", "manifest.webmanifest",
  "icon-192.png", "icon-512.png", "assets/images/rajul.jpg",
  "assets/images/social/instagram.webp", "assets/images/social/facebook.webp",
  "assets/images/social/tiktok.webp", "assets/images/social/youtube.webp",
  "assets/images/social/whatsapp.webp",
  ...MP3
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(FILES.map(f => c.add(f)))));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Découpe une réponse complète en réponse partielle (nécessaire pour lire l'audio hors ligne) */
async function withRange(req, res) {
  const h = req.headers.get("range");
  if (!h || res.status !== 200) return res;
  const buf = await res.clone().arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(h);
  if (!m) return res;
  const size = buf.byteLength;
  let start = m[1] ? +m[1] : 0;
  let end = m[2] ? +m[2] : size - 1;
  if (!m[1] && m[2]) { start = Math.max(0, size - +m[2]); end = size - 1; }
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1)
    }
  });
}

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const net = await fetch(new Request(req.url, { cache: "no-cache" }));
    if (net.ok) cache.put(req.url, net.clone());
    return net;
  } catch (err) {
    const hit = await cache.match(req.url, { ignoreSearch: true });
    return hit || (await cache.match("index.html")) || new Response("Hors ligne", { status: 503 });
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req.url, { ignoreSearch: true });
  if (hit) return withRange(req, hit);
  try {
    const net = await fetch(req);
    if (net.status === 200) cache.put(req.url, net.clone());
    return net;
  } catch (err) {
    return new Response("", { status: 504 });
  }
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const code = req.mode === "navigate" || url.pathname.endsWith("/") ||
    /\.(html|css|js|webmanifest)$/.test(url.pathname);
  e.respondWith(code ? networkFirst(req) : cacheFirst(req));
});
