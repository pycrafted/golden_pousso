export function getCachedImageUrl(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw).url : null;
  } catch { return null; }
}

export function setCachedImageUrl(key, url) {
  try { localStorage.setItem(key, JSON.stringify({ url })); } catch {}
}
