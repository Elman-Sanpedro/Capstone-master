import { useEffect, useState } from 'react';

interface PasswordStrengthIndicatorProps {
    password: string;
}

interface StrengthLevel {
    label: string;
    color: string;
    bgColor: string;
    width: string;
    score: number;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const [strength, setStrength] = useState<StrengthLevel>({
        label: 'Very Weak',
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        width: 'w-1/5',
        score: 0
    });

    useEffect(() => {
        const calculateStrength = (pwd: string): StrengthLevel => {
            let score = 0;
            
            // Length check
            if (pwd.length >= 8) score += 1;
            if (pwd.length >= 12) score += 1;
            
            // Character variety checks
            if (/[a-z]/.test(pwd)) score += 1; // lowercase
            if (/[A-Z]/.test(pwd)) score += 1; // uppercase
            if (/[0-9]/.test(pwd)) score += 1; // numbers
            if (/[@$!%*?&.]/.test(pwd)) score += 1; // special characters
            
            // Determine strength level based on score
            if (score <= 2) {
                return {
                    label: 'Very Weak',
                    color: 'text-red-600 dark:text-red-400',
                    bgColor: 'bg-red-500',
                    width: 'w-1/5',
                    score: 1
                };
            } else if (score === 3) {
                return {
                    label: 'Weak',
                    color: 'text-orange-600 dark:text-orange-400',
                    bgColor: 'bg-orange-500',
                    width: 'w-2/5',
                    score: 2
                };
            } else if (score === 4) {
                return {
                    label: 'Fair',
                    color: 'text-yellow-600 dark:text-yellow-400',
                    bgColor: 'bg-yellow-500',
                    width: 'w-3/5',
                    score: 3
                };
            } else if (score === 5) {
                return {
                    label: 'Good',
                    color: 'text-blue-600 dark:text-blue-400',
                    bgColor: 'bg-blue-500',
                    width: 'w-4/5',
                    score: 4
                };
            } else {
                return {
                    label: 'Strong',
                    color: 'text-green-600 dark:text-green-400',
                    bgColor: 'bg-green-500',
                    width: 'w-full',
                    score: 5
                };
            }
        };

        if (password) {
            setStrength(calculateStrength(password));
        } else {
            setStrength({
                label: 'Very Weak',
                color: 'text-red-600 dark:text-red-400',
                bgColor: 'bg-red-500',
                width: 'w-1/5',
                score: 0
            });
        }
    }, [password]);

    const getRequirements = () => [
        { text: 'At least 8 characters', met: password.length >= 8 },
        { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
        { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
        { text: 'Contains number', met: /[0-9]/.test(password) },
        { text: 'Contains special character (@$!%*?&.)', met: /[@$!%*?&.]/.test(password) }
    ];

    if (!password) return null;

    return (
        <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${strength.color}`}>
                    Password Strength: {strength.label}
                </span>
                <span className={`text-xs ${strength.color}`}>
                    {strength.score}/5
                </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-300 ease-out ${strength.bgColor} ${strength.width}`}
                />
            </div>

            {/* Requirements list */}
            <div className="space-y-1 mt-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-2">
                    Password requirements:
                </p>
                {getRequirements().map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                            req.met 
                                ? 'bg-green-500' 
                                : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                            {req.met && (
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <span className={`text-xs ${
                            req.met 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-slate-500 dark:text-slate-400'
                        }`}>
                            {req.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
