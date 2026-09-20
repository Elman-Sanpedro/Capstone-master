import { useState } from 'react';
import { getCsrfToken } from '@/lib/csrf';
import type { PreOrderSummary } from '@/types/customer-order';

// Standardized on Dashboard's fuller error handling (logs + alerts) over
// Cart's silent swallow, per the de-dup plan — doesn't lose information.
export function usePreOrders<T extends PreOrderSummary = PreOrderSummary>() {
    const [preOrders, setPreOrders] = useState<T[]>([]);
    const [showPreOrdersModal, setShowPreOrdersModal] = useState(false);

    const fetchPreOrders = async () => {
        try {
            const response = await fetch('/customer/orders', {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });
            if (response.ok) {
                const data = await response.json();
                // Filter only pre-orders that are still pending or processing
                const preorderData = data.filter((order: T) => order.order_type === 'preorder' && (order.status === 'Pending' || order.status === 'Processing'));
                setPreOrders(preorderData);
                setShowPreOrdersModal(true);
            } else {
                alert('Failed to fetch pre-orders');
            }
        } catch (error) {
            console.error('Error fetching pre-orders:', error);
            alert('Failed to fetch pre-orders');
        }
    };

    return { preOrders, showPreOrdersModal, setShowPreOrdersModal, fetchPreOrders };
}
