import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * A small "i" icon shown next to a form field's label. Hovering (or
 * tapping, on touch devices — Radix's Tooltip falls back to tap when
 * there's no hover support) shows a short hint above it.
 *
 * Must be rendered as a SIBLING of the field's <Label>, never nested
 * inside it — a <Label> renders a native <label for="...">, and nesting
 * another interactive element (this button) inside one causes the label's
 * default click-to-focus behavior to fire at the same time as this
 * button's own click, and removes this hint from screen readers' expected
 * structure.
 */
export function FieldHint({ text }: { text: string }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="text-slate-400 hover:text-cyan-500 dark:text-slate-500 dark:hover:text-cyan-400 transition-colors"
                    >
                        <Info className="w-3.5 h-3.5" />
                        <span className="sr-only">More info</span>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64 text-center">
                    {text}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
