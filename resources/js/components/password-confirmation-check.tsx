import { useEffect, useState } from 'react';

interface PasswordConfirmationCheckProps {
    password: string;
    passwordConfirmation: string;
}

export default function PasswordConfirmationCheck({ password, passwordConfirmation }: PasswordConfirmationCheckProps) {
    const [matchStatus, setMatchStatus] = useState<{
        status: 'empty' | 'matching' | 'not-matching';
        message: string;
        color: string;
    }>({
        status: 'empty',
        message: '',
        color: ''
    });

    useEffect(() => {
        if (!passwordConfirmation) {
            setMatchStatus({
                status: 'empty',
                message: '',
                color: ''
            });
            return;
        }

        if (password === passwordConfirmation) {
            setMatchStatus({
                status: 'matching',
                message: 'Passwords match!',
                color: 'text-green-600 dark:text-green-400'
            });
        } else {
            setMatchStatus({
                status: 'not-matching',
                message: 'Passwords do not match',
                color: 'text-red-600 dark:text-red-400'
            });
        }
    }, [password, passwordConfirmation]);

    if (matchStatus.status === 'empty') {
        return null;
    }

    return (
        <div className={`flex items-center gap-2 text-xs mt-1 ${matchStatus.color}`}>
            {matchStatus.status === 'matching' ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            )}
            <span>{matchStatus.message}</span>
        </div>
    );
}
