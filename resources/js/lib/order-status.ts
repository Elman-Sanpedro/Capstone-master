// Status pill colors used for order/pre-order lists across the customer pages.
export function getStatusColor(status: string): string {
    switch (status) {
        case 'Completed': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
        case 'Processing': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
        case 'Pending': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';
        case 'Cancelled': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
        default: return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300';
    }
}
