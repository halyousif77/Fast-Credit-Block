// Small client-side cache/deduper for our own /api GET requests.
// It prevents the same API from being called repeatedly while navigating
// between dashboard pages. Mutating requests automatically clear the cache.

type CacheEntry = {
  body: string;
  status: number;
  statusText: string;
  headers: [string, string][];
  expiresAt: number;
};

const CACHE_TTL = 60_000;
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<CacheEntry>>();
const STORAGE_PREFIX = "api-cache:v1:";

function canUseSessionStorage(key: string, bodyLength?: number) {
  return key !== "/api/credit-data" && (bodyLength === undefined || bodyLength < 1_500_000);
}

function readStored(key: string): CacheEntry | null {
  if (!canUseSessionStorage(key)) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry.expiresAt || entry.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeStored(key: string, entry: CacheEntry) {
  if (!canUseSessionStorage(key, entry.body.length)) return;
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage can be full/private-mode; the in-memory cache still works.
  }
}

function keyFor(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isApiGet(input: RequestInfo | URL, init?: RequestInit) {
  const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  const url = keyFor(input);
  return method === "GET" && (url.startsWith("/api/") || url.includes("/api/"));
}

function responseFromEntry(entry: CacheEntry) {
  return new Response(entry.body, {
    status: entry.status,
    statusText: entry.statusText,
    headers: entry.headers,
  });
}

export function clearApiCache() {
  cache.clear();
  if (typeof window === "undefined") return;
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {}
}

async function requestAndCache(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  key: string,
): Promise<CacheEntry> {
  const response = await window.fetch(input, init);
  const body = await response.clone().text();

  const entry: CacheEntry = {
    body,
    status: response.status,
    statusText: response.statusText,
    headers: Array.from(response.headers.entries()),
    expiresAt: Date.now() + CACHE_TTL,
  };

  if (response.ok) {
    cache.set(key, entry);
    writeStored(key, entry);
  }
  return entry;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (typeof window === "undefined") {
    return fetch(input, init);
  }

  const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

  // Any write can change dashboard data, so don't serve stale API results
  // after uploads, edits, deletes, or notifications.
  if (method !== "GET") {
    clearApiCache();
    return window.fetch(input, init);
  }

  if (!isApiGet(input, init)) {
    return window.fetch(input, init);
  }

  const key = keyFor(input);
  const existing = cache.get(key) || readStored(key);

  if (existing && existing.expiresAt > Date.now()) {
    cache.set(key, existing);
    return responseFromEntry(existing);
  }

  if (existing) cache.delete(key);

  let pending = inFlight.get(key);
  if (!pending) {
    pending = requestAndCache(input, init, key).finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, pending);
  }

  return responseFromEntry(await pending);
}
