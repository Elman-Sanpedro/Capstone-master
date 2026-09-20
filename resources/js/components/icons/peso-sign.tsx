import React from 'react';

// Drawn as a lucide-style outline icon so it matches the stroke weight of
// the other lucide-react icons instead of standing out as a bold filled
// glyph. Used wherever a currency icon is needed, since lucide's built-in
// CircleDollarSign is the wrong currency for this app.
const PesoSign = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => (
    <svg
        ref={ref}
        className={className}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M7 21V4h6a4 4 0 0 1 0 8H7" />
        <path d="M4 10h9" />
        <path d="M4 14h9" />
    </svg>
));
PesoSign.displayName = 'PesoSign';

export default PesoSign;
