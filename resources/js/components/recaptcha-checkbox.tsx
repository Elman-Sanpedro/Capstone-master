import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { RECAPTCHA_SITE_KEY, loadRecaptchaScript } from '@/lib/recaptcha';

export interface RecaptchaCheckboxHandle {
    /** Clears the checkbox back to unchecked (call after a failed submit). */
    reset: () => void;
}

interface RecaptchaCheckboxProps {
    /** Called with the token when checked, or '' when unchecked/expired/errored. */
    onChange: (token: string) => void;
}

/**
 * Renders the visible Google reCAPTCHA v2 "I'm not a robot" checkbox.
 *
 * Renders nothing (and onChange is never called) when
 * VITE_RECAPTCHA_SITE_KEY isn't configured, so pages using this component
 * keep working normally before CAPTCHA keys are set up.
 */
const RecaptchaCheckbox = forwardRef<RecaptchaCheckboxHandle, RecaptchaCheckboxProps>(function RecaptchaCheckbox(
    { onChange },
    ref,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<number | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (widgetId.current !== null) {
                window.grecaptcha?.reset(widgetId.current);
            }
            onChangeRef.current('');
        },
    }));

    useEffect(() => {
        // Captured as a local so TS keeps the non-null narrowing inside the
        // .then() closure below (narrowing on the module-level import isn't
        // preserved across the async boundary).
        const siteKey = RECAPTCHA_SITE_KEY;
        if (!siteKey || !containerRef.current) {
            return;
        }

        let cancelled = false;

        loadRecaptchaScript().then(() => {
            if (cancelled || !containerRef.current || widgetId.current !== null || !window.grecaptcha) {
                return;
            }

            widgetId.current = window.grecaptcha.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token) => onChangeRef.current(token),
                'expired-callback': () => onChangeRef.current(''),
                'error-callback': () => onChangeRef.current(''),
            });
        });

        return () => {
            cancelled = true;
        };
    }, []);

    if (!RECAPTCHA_SITE_KEY) {
        return null;
    }

    return <div ref={containerRef} />;
});

export default RecaptchaCheckbox;
