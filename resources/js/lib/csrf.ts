// Reads the CSRF token Laravel embeds in the page <head>, used by every
// customer-facing fetch()/FormData POST that isn't routed through Inertia.
//
// This is stamped once when the page's HTML first renders and never
// updates again for the life of that page load. Kept as-is for existing
// callers that pair it with the plain 'X-CSRF-TOKEN' header; for anything
// that might stay open a long time (a POS terminal left up for a full
// shift is the case that surfaced this), prefer getCsrfHeaders() below.
export function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

// Returns the CSRF header to spread into a fetch() headers object, e.g.
// `headers: { ...getCsrfHeaders() }`.
//
// Prefers the XSRF-TOKEN cookie over the static meta tag: Laravel reissues
// that cookie on *every* response for as long as the session stays valid,
// while the meta tag never changes after the initial page load. A page
// left open for hours (the meta tag's token can drift out of sync with the
// session's real token well before the session itself expires) would
// otherwise get a spurious "CSRF token mismatch" on its next submit even
// though the user is still logged in. Reading the cookie fresh on every
// call avoids that. The cookie value is sent exactly as Laravel set it
// (still encrypted) under X-XSRF-TOKEN, which is what Laravel's CSRF
// middleware expects and decrypts server-side; the meta tag's plain token
// goes under X-CSRF-TOKEN as before when no cookie is present yet.
export function getCsrfHeaders(): Record<string, string> {
    const cookieMatch = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    if (cookieMatch) {
        return { 'X-XSRF-TOKEN': decodeURIComponent(cookieMatch[1]) };
    }

    return { 'X-CSRF-TOKEN': getCsrfToken() };
}
