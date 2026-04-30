const TTL = 24 * 60 * 60 * 1000; // 24h

export function getCachedImageUrl(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { url, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL) { localStorage.removeItem(key); return null; }
    return url;
  } catch { return null; }
}

export function setCachedImageUrl(key, url) {
  try { localStorage.setItem(key, JSON.stringify({ url, ts: Date.now() })); } catch {}
}
