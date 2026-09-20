import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, LoaderCircle, AlertCircle } from 'lucide-react';

interface UsernameAvailabilityProps {
    username: string;
}

export default function UsernameAvailability({ username }: UsernameAvailabilityProps) {
    const [availability, setAvailability] = useState<{
        status: 'idle' | 'checking' | 'available' | 'taken' | 'error';
        message: string;
    }>({
        status: 'idle',
        message: ''
    });

    useEffect(() => {
        if (username.length < 3) {
            setAvailability({
                status: 'idle',
                message: ''
            });
            return;
        }

        const timeoutId = setTimeout(() => {
            checkUsernameAvailability();
        }, 500); // Debounce for 500ms

        return () => clearTimeout(timeoutId);
    }, [username]);

    const checkUsernameAvailability = async () => {
        setAvailability({ status: 'checking', message: 'Checking availability...' });

        try {
            // Simulate API call - replace with actual endpoint
            const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.available) {
                    setAvailability({
                        status: 'available',
                        message: 'Username is available!'
                    });
                } else {
                    setAvailability({
                        status: 'taken',
                        message: 'Username is already taken'
                    });
                }
            } else {
                setAvailability({
                    status: 'error',
                    message: 'Unable to verify. Please try again.'
                });
            }
        } catch (error) {
            setAvailability({
                status: 'error',
                message: 'Unable to verify. Please try again.'
            });
        }
    };

    if (availability.status === 'idle' || username.length < 3) {
        return (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Username must be at least 3 characters long
            </div>
        );
    }

    return (
        <div className="mt-1">
            <div className={`flex items-center gap-2 text-xs ${
                availability.status === 'checking'
                    ? 'text-slate-500 dark:text-slate-400'
                    : availability.status === 'available'
                    ? 'text-green-600 dark:text-green-400'
                    : availability.status === 'error'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
            }`}>
                {availability.status === 'checking' && (
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                )}
                {availability.status === 'available' && (
                    <CheckCircle className="h-3 w-3" />
                )}
                {availability.status === 'taken' && (
                    <XCircle className="h-3 w-3" />
                )}
                {availability.status === 'error' && (
                    <AlertCircle className="h-3 w-3" />
                )}
                <span>{availability.message}</span>
            </div>
        </div>
    );
}
