import * as React from 'react';
import { router } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { CheckCircle } from 'lucide-react';

interface FlashProps {
    welcomeUser?: string | null;
}

const AUTO_DISMISS_MS = 3000;

/**
 * Shows a centered "Welcome back, {name}!" popup right after a successful login,
 * on whichever dashboard the user lands on (customer, cashier, delivery, admin).
 * Kept separate from FlashToaster (the small corner toast used for every other
 * success/error message) on purpose: login used to also push a 'success' flash,
 * which meant the corner toast AND this popup both fired for the same event.
 * Login now flashes its own 'welcomeUser' key instead, so only this shows.
 */
export default function WelcomeBackModal({ initialFlash }: { initialFlash?: FlashProps }) {
    const [name, setName] = React.useState<string | null>(null);

    const showFor = React.useCallback((userName: string) => {
        setName(userName);
        window.setTimeout(() => setName(null), AUTO_DISMISS_MS);
    }, []);

    // Covers the page already rendered when the app mounted (the dashboard Inertia
    // redirected to right after the login form submitted).
    React.useEffect(() => {
        if (initialFlash?.welcomeUser) showFor(initialFlash.welcomeUser);
        // Only run once, on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Covers the same redirect when it happens as a client-side Inertia visit
    // rather than a full page load.
    React.useEffect(() => {
        return router.on('success', (event) => {
            const flash = (event.detail.page.props as { flash?: FlashProps }).flash;
            if (flash?.welcomeUser) showFor(flash.welcomeUser);
        });
    }, [showFor]);

    return (
        <Transition
            show={!!name}
            enter="transition ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
        >
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4">
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-cyan-200 dark:border-cyan-700 px-8 py-6">
                    <CheckCircle className="w-8 h-8 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">Welcome back, {name}!</span>
                </div>
            </div>
        </Transition>
    );
}
