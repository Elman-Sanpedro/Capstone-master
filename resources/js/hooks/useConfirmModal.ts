import { useCallback, useState } from 'react';

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

// Promise-based drop-in for window.confirm(), backed by the centered
// ConfirmModal component instead of the browser's own dialog chrome.
//
//   const { confirm, confirmModalProps } = useConfirmModal();
//   ...
//   if (!(await confirm('Delete this record?'))) return;
//   // or with options: await confirm({ message: '...', danger: true })
//   ...
//   return <ConfirmModal {...confirmModalProps} />;
export function useConfirmModal() {
    const [pending, setPending] = useState<PendingConfirm | null>(null);

    const confirm = useCallback((options: ConfirmOptions | string) => {
        const opts = typeof options === 'string' ? { message: options } : options;
        return new Promise<boolean>((resolve) => {
            setPending({ ...opts, resolve });
        });
    }, []);

    const respond = (value: boolean) => {
        pending?.resolve(value);
        setPending(null);
    };

    const confirmModalProps = {
        open: !!pending,
        title: pending?.title,
        message: pending?.message ?? '',
        confirmLabel: pending?.confirmLabel,
        cancelLabel: pending?.cancelLabel,
        danger: pending?.danger,
        onConfirm: () => respond(true),
        onCancel: () => respond(false),
    };

    return { confirm, confirmModalProps };
}
