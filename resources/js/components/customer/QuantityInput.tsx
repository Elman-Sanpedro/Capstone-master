import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * Coerces a stock value to a whole, non-negative count. Handles Laravel
 * decimal-cast fields (e.g. inventory.current_quantity) which serialize to
 * JSON as strings like "20.00" — used here and by QuantityInput's own `max`
 * clamp so a displayed "N available" figure and the actual enforced limit
 * can never drift apart.
 */
export function toStockCount(raw?: number | string | null): number {
    if (raw === undefined || raw === null || raw === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

interface QuantityInputProps {
    value: number;
    onChange: (value: number) => void;
    /**
     * Available stock — the typed/stepped value is clamped to this.
     * Accepts a string too: Laravel decimal-cast columns (e.g.
     * inventory.current_quantity) serialize to JSON as strings like
     * "20.00", not numbers, even though the TS type says `number`.
     */
    max?: number | string;
    min?: number;
    className?: string;
    inputClassName?: string;
    buttonClassName?: string;
    size?: 'sm' | 'md';
}

/**
 * Qty stepper that also accepts direct typing, so a customer ordering a big
 * quantity doesn't have to click "+" repeatedly. Whatever is typed is capped
 * to `max` (available stock) as soon as it would exceed it.
 */
export default function QuantityInput({
    value,
    onChange,
    max,
    min = 0,
    className = '',
    inputClassName = '',
    buttonClassName = '',
    size = 'md',
}: QuantityInputProps) {
    const cap = max === undefined || max === null || max === '' ? Infinity : toStockCount(max);
    const clamp = (n: number) => Math.min(Math.max(n, min), cap);

    const [draft, setDraft] = useState(String(value));
    const focused = useRef(false);

    // Keep the field in sync with external changes (e.g. the +/- buttons,
    // or the value being reset elsewhere) as long as the user isn't
    // mid-keystroke in it.
    useEffect(() => {
        if (!focused.current) setDraft(String(value));
    }, [value]);

    const commit = (raw: string) => {
        const digits = raw.replace(/[^0-9]/g, '');
        if (digits === '') {
            setDraft('');
            return;
        }
        const clamped = clamp(parseInt(digits, 10));
        setDraft(String(clamped));
        onChange(clamped);
    };

    const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-9 h-8';

    return (
        <div className={`flex items-center border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden ${className}`}>
            <button
                type="button"
                onClick={() => onChange(clamp(value - 1))}
                disabled={value <= min}
                className={`${btnSize} flex items-center justify-center bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 transition-colors ${buttonClassName}`}
            ><Minus className="w-3 h-3" /></button>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={draft}
                onFocus={() => { focused.current = true; }}
                onChange={(e) => commit(e.target.value)}
                onBlur={() => {
                    focused.current = false;
                    if (draft === '') {
                        setDraft(String(min));
                        onChange(min);
                    } else {
                        setDraft(String(value));
                    }
                }}
                className={`flex-1 min-w-0 text-center text-sm font-semibold text-gray-900 dark:text-white bg-transparent py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${inputClassName}`}
            />
            <button
                type="button"
                onClick={() => onChange(clamp(value + 1))}
                disabled={value >= cap}
                className={`${btnSize} flex items-center justify-center bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 transition-colors ${buttonClassName}`}
            ><Plus className="w-3 h-3" /></button>
        </div>
    );
}
