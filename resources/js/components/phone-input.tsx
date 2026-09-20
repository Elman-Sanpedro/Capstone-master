import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PhoneInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
    /** The full stored value, e.g. "+639074619915" or "" — never just the local part. */
    value: string;
    /** Called with the full value (with "+63" re-attached), or "" if nothing was typed. */
    onChange: (fullValue: string) => void;
}

const PH_PREFIX = '+63';

/**
 * A Philippine mobile number input: a fixed, non-editable "+63" prefix
 * followed by an editable box for just the 10 local digits (e.g. the user
 * types "9074619915", never the "+63" or the old local "0" prefix).
 *
 * The value passed in/out is always the full "+639XXXXXXXXX" string, so
 * callers don't need to know about the split — only this component does.
 */
/**
 * Derives the editable 10-digit local part from a stored value, tolerating
 * legacy formats that predate the +63 prefix — e.g. "09171234567" or
 * "0917-123-4567" from before this component existed. Non-digits are
 * stripped and a leading "0" (the old local trunk prefix) is dropped, so
 * an old value still displays correctly next to the new "+63" prefix
 * instead of showing raw digits/dashes that no longer make sense there.
 */
function deriveLocalDigits(value: string): string {
    if (value.startsWith(PH_PREFIX)) {
        return value.slice(PH_PREFIX.length);
    }

    const digitsOnly = value.replace(/\D/g, '');
    const withoutLeadingZero = digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly;
    return withoutLeadingZero.slice(0, 10);
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(({ value, onChange, className, placeholder, ...props }, ref) => {
    const localDigits = deriveLocalDigits(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
        onChange(digits ? PH_PREFIX + digits : '');
    };

    return (
        <div className="flex">
            {/* Fixed prefix chip — kept visually neutral on purpose (not fed
                the caller's className) since that className is meant for
                the real input's sizing/padding/border (e.g. "pl-10 w-full"),
                which would look wrong applied to this small fixed box too. */}
            <span className="flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 select-none shrink-0">
                {PH_PREFIX}
            </span>
            <input
                ref={ref}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={localDigits}
                onChange={handleChange}
                placeholder={placeholder}
                className={cn(
                    'flex h-10 w-full rounded-r-md border px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    className,
                )}
                {...props}
            />
        </div>
    );
});
PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
