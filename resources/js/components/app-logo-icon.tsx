import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            {/* Ice cube with crystalline structure */}
            <defs>
                <linearGradient id="iceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e0f2fe" />
                    <stop offset="50%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="iceHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
                </linearGradient>
            </defs>
            
            {/* Main ice cube */}
            <path d="M20 30 L50 15 L80 30 L80 70 L50 85 L20 70 Z" fill="url(#iceGradient)" stroke="#0284c7" strokeWidth="2"/>
            
            {/* Ice cube faces for 3D effect */}
            <path d="M20 30 L50 15 L50 55 L20 70 Z" fill="url(#iceHighlight)" opacity="0.6"/>
            <path d="M50 15 L80 30 L80 70 L50 55 Z" fill="#bae6fd" opacity="0.4"/>
            
            {/* Crystalline patterns */}
            <line x1="35" y1="22" x2="35" y2="78" stroke="#ffffff" strokeWidth="1" opacity="0.5"/>
            <line x1="50" y1="15" x2="50" y2="85" stroke="#ffffff" strokeWidth="1" opacity="0.5"/>
            <line x1="65" y1="22" x2="65" y2="78" stroke="#ffffff" strokeWidth="1" opacity="0.5"/>
            
            <line x1="20" y1="50" x2="80" y2="50" stroke="#ffffff" strokeWidth="1" opacity="0.5"/>
            <line x1="27" y1="35" x2="73" y2="65" stroke="#ffffff" strokeWidth="1" opacity="0.5"/>
            <line x1="27" y1="65" x2="73" y2="35" stroke="#ffffff" strokeWidth="1" opacity="0.5"/>
            
            {/* Sparkle effects */}
            <circle cx="30" cy="25" r="2" fill="#ffffff" opacity="0.9"/>
            <circle cx="70" cy="35" r="1.5" fill="#ffffff" opacity="0.8"/>
            <circle cx="40" cy="60" r="1" fill="#ffffff" opacity="0.7"/>
        </svg>
    );
}
