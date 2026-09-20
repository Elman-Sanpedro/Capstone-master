import { ReactNode, TouchEvent, useRef, useState } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
    /** Called when the user pulls past the threshold and releases. Awaited
     * so the spinner stays visible until the refresh actually finishes. */
    onRefresh: () => Promise<void> | void;
    children: ReactNode;
    className?: string;
}

const PULL_THRESHOLD = 70; // px of downward pull needed to trigger a refresh
const MAX_PULL = 110; // visual cap so the indicator can't be dragged off-screen
const RESISTANCE = 0.5; // pull feels "heavier" than a 1:1 finger-follow

/**
 * The familiar mobile "swipe down from the top to reload" gesture (Gmail,
 * Instagram, etc.), for customers who expect it as a matter of habit on
 * their phone — a deliberate on-demand refresh alongside any background
 * polling a page already does, not a replacement for it.
 *
 * Only activates when the wrapped content is scrolled to the very top, so
 * it never fights with normal downward scrolling further down the page.
 * Desktop/mouse users are unaffected — this only listens for touch events.
 */
export default function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number | null>(null);
    const pulling = useRef(false);

    const atTop = () => {
        const el = containerRef.current;
        // Check both the wrapper's own scroll position and the page's, since
        // depending on the layout either one might be the actual scroll
        // container for a given page.
        return (!el || el.scrollTop <= 0) && window.scrollY <= 0;
    };

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (refreshing || !atTop()) {
            startY.current = null;
            return;
        }
        startY.current = e.touches[0].clientY;
        pulling.current = false;
    };

    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (startY.current === null || refreshing) return;

        const delta = e.touches[0].clientY - startY.current;
        if (delta <= 0 || !atTop()) {
            // Scrolled away from the top mid-gesture, or swiping up — bail.
            setPullDistance(0);
            pulling.current = false;
            return;
        }

        pulling.current = true;
        setPullDistance(Math.min(delta * RESISTANCE, MAX_PULL));
    };

    const handleTouchEnd = async () => {
        if (!pulling.current) {
            startY.current = null;
            return;
        }
        pulling.current = false;
        startY.current = null;

        if (pullDistance >= PULL_THRESHOLD) {
            setRefreshing(true);
            setPullDistance(PULL_THRESHOLD);
            try {
                await onRefresh();
            } finally {
                setRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    };

    const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

    return (
        <div
            ref={containerRef}
            className={cn('relative', className)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
                style={{ height: refreshing ? PULL_THRESHOLD : pullDistance }}
                aria-hidden={pullDistance === 0 && !refreshing}
            >
                {refreshing ? (
                    <Loader2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-spin" />
                ) : (
                    <ArrowDown
                        className="w-5 h-5 text-cyan-600 dark:text-cyan-400 transition-transform"
                        style={{ transform: `rotate(${progress * 180}deg)`, opacity: progress }}
                    />
                )}
            </div>
            {children}
        </div>
    );
}
