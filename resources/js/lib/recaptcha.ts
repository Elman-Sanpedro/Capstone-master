// Loader for the Google reCAPTCHA v2 widget script (the visible "I'm not a
// robot" checkbox). Shared by every page that renders a <RecaptchaCheckbox>.
//
// If VITE_RECAPTCHA_SITE_KEY is not set (e.g. local dev before keys are
// configured), the widget component simply renders nothing, so every form
// using it keeps working with CAPTCHA disabled. The backend (see
// App\Services\RecaptchaVerifier) mirrors this: it skips verification when
// RECAPTCHA_SECRET_KEY is unset.

declare global {
    interface Window {
        grecaptcha?: {
            render: (
                container: string | HTMLElement,
                params: {
                    sitekey: string;
                    callback: (token: string) => void;
                    'expired-callback'?: () => void;
                    'error-callback'?: () => void;
                },
            ) => number;
            reset: (widgetId?: number) => void;
        };
        onRecaptchaScriptLoad?: () => void;
    }
}

export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

let scriptPromise: Promise<void> | null = null;

/**
 * Loads the reCAPTCHA widget script once (safe to call from multiple
 * components/pages). Resolves once `window.grecaptcha.render` is ready to use.
 */
export function loadRecaptchaScript(): Promise<void> {
    if (window.grecaptcha?.render) {
        return Promise.resolve();
    }

    if (!scriptPromise) {
        scriptPromise = new Promise((resolve) => {
            window.onRecaptchaScriptLoad = () => resolve();

            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaScriptLoad&render=explicit';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        });
    }

    return scriptPromise;
}
