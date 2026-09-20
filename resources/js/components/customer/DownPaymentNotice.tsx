import type { OrderFormState } from '@/types/customer-order';

interface DownPaymentNoticeProps {
    orderForm: OrderFormState;
    total: number;
}

// Renders the amber down-payment box. It's a pure function of orderForm/total,
// so the same component is used at both call sites (before the payment method
// section for preorder/pickup+cash, and after the address section for
// delivery+COD) — only one variant (or none) ever matches at a time since
// order_type is mutually exclusive between the two conditions.
export default function DownPaymentNotice({ orderForm, total }: DownPaymentNoticeProps) {
    const isPreorderOrPickupCash = orderForm.order_type === 'preorder' || (orderForm.order_type === 'pickup' && orderForm.payment_method === 'Cash');
    const isDeliveryCash = orderForm.order_type === 'delivery' && orderForm.payment_method === 'Cash';

    if (isPreorderOrPickupCash) {
        return (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">
                    {orderForm.order_type === 'pickup' ? 'GCash Downpayment Required' : 'Downpayment Required (50%)'}
                </p>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                        Downpayment ({orderForm.order_type === 'preorder' ? '50%' : '20%'})
                    </span>
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                        ₱{(total * (orderForm.order_type === 'preorder' ? 0.5 : 0.2)).toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-700 dark:text-amber-300">Remaining balance</span>
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        ₱{(total * (orderForm.order_type === 'preorder' ? 0.5 : 0.8)).toFixed(2)}
                    </span>
                </div>
                {orderForm.order_type === 'pickup' && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Pay ₱{(total * 0.2).toFixed(2)} via GCash now. Remaining ₱{(total * 0.8).toFixed(2)} in cash when you pick up.
                    </p>
                )}
            </div>
        );
    }

    if (isDeliveryCash) {
        return (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">Downpayment Required (COD)</p>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-amber-700 dark:text-amber-300">Downpayment (20%)</span>
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">₱{(total * 0.2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-700 dark:text-amber-300">Remaining (pay on delivery)</span>
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">₱{(total * 0.8).toFixed(2)}</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Pay ₱{(total * 0.2).toFixed(2)} via GCash now. Remaining ₱{(total * 0.8).toFixed(2)} in cash upon delivery.
                </p>
            </div>
        );
    }

    return null;
}
