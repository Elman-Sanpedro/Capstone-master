import { CreditCard } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { OrderFormState } from '@/types/customer-order';

interface PaymentMethodSelectorProps {
    orderForm: OrderFormState;
    setOrderForm: Dispatch<SetStateAction<OrderFormState>>;
    total: number;
}

export default function PaymentMethodSelector({ orderForm, setOrderForm, total }: PaymentMethodSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method
            </label>
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setOrderForm(prev => ({ ...prev, payment_method: 'Cash' }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                        orderForm.payment_method === 'Cash'
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                >
                    <div className="flex flex-col items-center">
                        <span className="text-3xl mb-2 text-gray-600 dark:text-gray-300 font-bold">₱</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {(orderForm.order_type === 'pickup' || orderForm.order_type === 'preorder') ? 'Cash on Pickup' : 'Cash on Delivery'}
                        </span>
                    </div>
                </button>
                <button
                    type="button"
                    onClick={() => setOrderForm(prev => ({ ...prev, payment_method: 'GCash' }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                        orderForm.payment_method === 'GCash'
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                >
                    <div className="flex flex-col items-center">
                        <CreditCard className="w-8 h-8 mb-2 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium text-gray-900 dark:text-white">GCash</span>
                    </div>
                </button>
            </div>

            {/* GCash full payment reminder */}
            {orderForm.payment_method === 'GCash' && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Full payment required.</strong> You will need to send the full amount of <strong>₱{total.toFixed(2)}</strong> via GCash and upload your receipt before your order is processed.
                    </p>
                </div>
            )}
        </div>
    );
}
