const PREFIX = "brikity_fs_cache_v1_";
const DEFAULT_TTL_MS = 5 * 60 * 1000;

const memory = new Map();

function storageKey(key) {
    return PREFIX + key;
}

function toPlain(value) {
    return JSON.parse(JSON.stringify(value, (_k, v) => {
        if (v && typeof v === "object" && typeof v.toDate === "function") {
            try { return v.toDate().toISOString(); } catch { return null; }
        }
        if (v === undefined) return null;
        return v;
    }));
}

export async function cachedFetch(key, fetcher, ttlMs = DEFAULT_TTL_MS) {
    const now = Date.now();

    const mem = memory.get(key);
    if (mem && (now - mem.ts) < ttlMs) {
        return mem.data;
    }

    try {
        const raw = sessionStorage.getItem(storageKey(key));
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.ts && (now - parsed.ts) < ttlMs && parsed.data != null) {
                memory.set(key, { data: parsed.data, ts: parsed.ts });
                return parsed.data;
            }
        }
    } catch {
        // ignore
    }

    const data = toPlain(await fetcher());
    memory.set(key, { data, ts: now });
    try {
        sessionStorage.setItem(storageKey(key), JSON.stringify({ data, ts: now }));
    } catch {
        // quota
    }
    return data;
}

export function clearCache(key) {
    if (key) {
        memory.delete(key);
        try { sessionStorage.removeItem(storageKey(key)); } catch { /* */ }
        return;
    }
    memory.clear();
    try {
        Object.keys(sessionStorage)
            .filter((k) => k.startsWith(PREFIX))
            .forEach((k) => sessionStorage.removeItem(k));
    } catch { /* */ }
}
