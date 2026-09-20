// 'warning' is for an action that completed successfully but was a negative
// outcome (e.g. a rejection) — distinct from 'success' (green, a positive
// outcome) and 'error' (red, the request itself failed).
export type ToastType = 'success' | 'warning' | 'error';

export const TOAST_EVENT = 'app:toast';

/**
 * Shows a corner toast via the app-wide FlashToaster (mounted once in
 * app.tsx). Use this from code paths that don't go through an Inertia visit
 * — a raw fetch() call, for example — and so never get a flash.success /
 * flash.error page prop to key off of.
 */
export function showToast(type: ToastType, message: string) {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { type, message } }));
}
