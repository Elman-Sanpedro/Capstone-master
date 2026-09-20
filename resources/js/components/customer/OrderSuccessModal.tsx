import { CheckCircle } from 'lucide-react';

interface OrderSuccessModalProps {
    open: boolean;
    onClose: () => void;
}

// Centered success confirmation shown after an order is placed with no
// further proof step required (e.g. Cash + dine-in). GCash and Cash-on-
// Delivery/pickup flows already show their own "Done" step inside
// GCashProofModal / CodProofModal, so this only covers the immediate-success
// path in useSubmitOrder, which previously reloaded the page with no
// feedback at all.
export default function OrderSuccessModal({ open, onClose }: OrderSuccessModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Order Placed Successfully!</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Thank you! Your order has been received and is now being processed.
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                    OK
                </button>
            </div>
        </div>
    );
}
