import { Truck, Package } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { OrderFormState } from '@/types/customer-order';

interface OrderTypeSelectorProps {
    orderForm: OrderFormState;
    setOrderForm: Dispatch<SetStateAction<OrderFormState>>;
}

export default function OrderTypeSelector({ orderForm, setOrderForm }: OrderTypeSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order Type
            </label>
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setOrderForm(prev => ({ ...prev, order_type: 'delivery', pickup_date: '', pickup_time: '' }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                        orderForm.order_type === 'delivery'
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                >
                    <div className="flex flex-col items-center">
                        <Truck className="w-8 h-8 mb-2 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium text-gray-900 dark:text-white text-center text-sm">Delivery</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">To your door</span>
                    </div>
                </button>
                <button
                    type="button"
                    onClick={() => setOrderForm(prev => ({ ...prev, order_type: 'pickup' }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                        (orderForm.order_type === 'pickup' || orderForm.order_type === 'preorder')
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                >
                    <div className="flex flex-col items-center">
                        <Package className="w-8 h-8 mb-2 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium text-gray-900 dark:text-white text-center text-sm">Pickup</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">At store</span>
                    </div>
                </button>
            </div>

            {/* Pre-order toggle inside Pickup */}
            {(orderForm.order_type === 'pickup' || orderForm.order_type === 'preorder') && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={orderForm.order_type === 'preorder'}
                            onChange={(e) => setOrderForm(prev => ({ ...prev, order_type: e.target.checked ? 'preorder' : 'pickup' }))}
                            className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Pre-order (Schedule for future pickup)
                        </span>
                    </label>
                </div>
            )}

            {/* Pickup date and time */}
            {(orderForm.order_type === 'pickup' || orderForm.order_type === 'preorder') && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Date</label>
                        <input
                            type="date"
                            value={orderForm.pickup_date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setOrderForm(prev => ({ ...prev, pickup_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Time</label>
                        <input
                            type="time"
                            value={orderForm.pickup_time}
                            onChange={(e) => setOrderForm(prev => ({ ...prev, pickup_time: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
