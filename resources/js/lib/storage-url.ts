/**
 * Payment-proof paths (orders.gcash_screenshot) come back from different
 * backend endpoints in two different shapes: most just return the bare
 * storage-relative path Laravel's store() gives them (e.g.
 * "gcash_proofs/xxx.jpg"), but a couple of CashierController endpoints
 * additionally wrap it in asset('storage/...') before responding, so it's
 * already an absolute URL. Rendering the bare form directly as an <img src>
 * resolves relative to the current page instead of storage and 404s.
 * Normalizes either shape into a URL the browser can actually load.
 */
export function storageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (/^https?:\/\//.test(path) || path.startsWith('/storage/')) return path;
    return `/storage/${path}`;
}
