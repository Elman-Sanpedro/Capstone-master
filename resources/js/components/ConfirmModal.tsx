interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    // Red confirm button for destructive/irreversible actions (delete,
    // cancel order, archive, etc.) instead of the default neutral color.
    danger?: boolean;
    // Disables both buttons and swaps the confirm label while an action
    // triggered by "confirm" is in flight (e.g. an in-progress request).
    processing?: boolean;
    processingLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

// Centered, styled replacement for window.confirm() — used everywhere a
// confirmation prompt is needed, across customer, admin, cashier, and
// delivery pages. Native confirm() dialogs are positioned by the browser
// (not the page), which looks inconsistent with the rest of the UI; this
// renders in the same centered-overlay style as the app's other modals
// (GCashProofModal, CodProofModal, OrderSuccessModal, etc).
export default function ConfirmModal({
    open,
    title = 'Are you sure?',
    message,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    danger = false,
    processing = false,
    processingLabel = 'Processing...',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">{message}</p>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            danger ? 'bg-red-500 hover:bg-red-600' : 'bg-cyan-500 hover:bg-cyan-600'
                        }`}
                    >
                        {processing ? processingLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
