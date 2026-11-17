import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const FALLBACK = "assets/logo-brikity.png";
const CACHE_KEY = "brikity_img_url_cache_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let storage = null;
const memoryCache = new Map();
const inflight = new Map();

export function initImageStorage(app) {
    if (app && !storage) {
        storage = getStorage(app);
    }
    return storage;
}

function isUsableHttpUrl(url) {
    return typeof url === "string" &&
        url.length > 4 &&
        (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/") || url.startsWith("data:"));
}

function readPersistentCache() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        const now = Date.now();
        const clean = {};
        for (const [path, entry] of Object.entries(parsed)) {
            if (entry && entry.url && entry.ts && (now - entry.ts) < CACHE_TTL_MS) {
                clean[path] = entry;
                memoryCache.set(path, entry.url);
            }
        }
        return clean;
    } catch {
        return {};
    }
}

function writePersistentCache(path, url) {
    try {
        const store = readPersistentCache();
        store[path] = { url, ts: Date.now() };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } catch {
        // ignore
    }
}

async function downloadUrlForPath(path) {
    if (!path || !storage) return null;
    if (memoryCache.has(path)) return memoryCache.get(path);

    const persisted = readPersistentCache();
    if (persisted[path]?.url) {
        memoryCache.set(path, persisted[path].url);
        return persisted[path].url;
    }

    if (inflight.has(path)) return inflight.get(path);

    const promise = getDownloadURL(ref(storage, path))
        .then((url) => {
            memoryCache.set(path, url);
            writePersistentCache(path, url);
            inflight.delete(path);
            return url;
        })
        .catch((e) => {
            inflight.delete(path);
            console.warn("Storage path resolve failed:", path, e.message);
            return null;
        });

    inflight.set(path, promise);
    return promise;
}

export async function resolveImageUrl(item, fallback = FALLBACK) {
    if (!item) return fallback;
    const raw = item.imageUrl || item.image || "";
    if (isUsableHttpUrl(raw)) return raw;
    if (item.storagePath && storage) {
        const url = await downloadUrlForPath(item.storagePath);
        if (url) return url;
    }
    return raw || fallback;
}

export async function resolveImages(items, fallback = FALLBACK) {
    if (!Array.isArray(items)) return [];
    return Promise.all(items.map(async (item) => {
        const url = await resolveImageUrl(item, fallback);
        return { ...item, imageUrl: url, image: url };
    }));
}
