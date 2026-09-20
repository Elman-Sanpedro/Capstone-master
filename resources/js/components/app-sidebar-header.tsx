import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, Bell, CheckCircle2, Package } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdminPendingOrder {
    order_id: number;
    total_amount: number;
    payment_method: string;
    customer?: { first_name: string; last_name: string } | null;
    user?: { full_name: string } | null;
}

interface LowStockProduct {
    product_id: number;
    product_name: string;
    current_quantity: number;
    min_stock_level: number;
}

const orderCustomerName = (order: AdminPendingOrder) =>
    order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : order.user?.full_name || 'Unknown Customer';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { props } = usePage<SharedData>();
    const adminPendingCount = props.admin_pending_count;
    const adminLowStockCount = props.admin_low_stock_count;

    const [notifOpen, setNotifOpen] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);
    const [pendingOrders, setPendingOrders] = useState<AdminPendingOrder[]>([]);

    const [stockOpen, setStockOpen] = useState(false);
    const [stockLoading, setStockLoading] = useState(false);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

    // Same "shortcut" role as the cashier header's bell — a quick glance at
    // what's waiting, with each row jumping straight into Pre-Orders instead
    // of an admin having to click through the sidebar and find it themselves.
    const loadPendingOrders = () => {
        setNotifLoading(true);
        fetch('/admin/api/orders/pending', { credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setPendingOrders(Array.isArray(data) ? data : []))
            .catch(() => setPendingOrders([]))
            .finally(() => setNotifLoading(false));
    };

    useEffect(() => {
        if (notifOpen) loadPendingOrders();
    }, [notifOpen]);

    const openOrder = (orderId: number) => {
        setNotifOpen(false);
        router.visit(`/admin/pre-orders?order=${orderId}`);
    };

    // Low stock bell — same shortcut idea, but for inventory instead of
    // orders. The Dashboard already shows this (stat card, alerts section,
    // once-per-visit popup), all scoped to that one page; this makes the
    // same count/list persistent across every admin page instead.
    const loadLowStockProducts = () => {
        setStockLoading(true);
        fetch('/admin/api/low-stock-products', { credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setLowStockProducts(Array.isArray(data) ? data : []))
            .catch(() => setLowStockProducts([]))
            .finally(() => setStockLoading(false));
    };

    useEffect(() => {
        if (stockOpen) loadLowStockProducts();
    }, [stockOpen]);

    const openInventory = () => {
        setStockOpen(false);
        router.visit('/admin/dashboard#inventory');
    };

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="ml-auto flex items-center gap-1">
                {adminLowStockCount !== null && adminLowStockCount !== undefined && (
                    <DropdownMenu open={stockOpen} onOpenChange={setStockOpen}>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                title={adminLowStockCount > 0 ? `Low Stock (${adminLowStockCount})` : 'Low Stock'}
                                className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
                            >
                                <AlertTriangle className="size-5 opacity-80" />
                                {adminLowStockCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                                        {adminLowStockCount > 99 ? '99+' : adminLowStockCount}
                                    </span>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80" align="end">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Low Stock</span>
                                {adminLowStockCount > 0 && (
                                    <span className="text-xs font-normal text-muted-foreground">{adminLowStockCount} item{adminLowStockCount !== 1 ? 's' : ''}</span>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-72 overflow-y-auto pr-1">
                                {stockLoading && (
                                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">Loading…</p>
                                )}
                                {!stockLoading && lowStockProducts.length === 0 && (
                                    <div className="flex flex-col items-center gap-1.5 px-2 py-6 text-center">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        <p className="text-sm text-muted-foreground">Stock levels look fine</p>
                                    </div>
                                )}
                                {!stockLoading &&
                                    lowStockProducts.map((product) => (
                                        <DropdownMenuItem
                                            key={product.product_id}
                                            onSelect={openInventory}
                                            className="flex items-start gap-2.5 py-2 cursor-pointer"
                                        >
                                            <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-900/30">
                                                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                            </span>
                                            <span className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium truncate">{product.product_name}</span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {product.current_quantity} left · min {product.min_stock_level}
                                                </span>
                                            </span>
                                        </DropdownMenuItem>
                                    ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {adminPendingCount !== null && adminPendingCount !== undefined && (
                    <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                title={adminPendingCount > 0 ? `Pending Orders (${adminPendingCount})` : 'Pending Orders'}
                                className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
                            >
                                <Bell className="size-5 opacity-80" />
                                {adminPendingCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                                        {adminPendingCount > 99 ? '99+' : adminPendingCount}
                                    </span>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80" align="end">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Pending Orders</span>
                                {adminPendingCount > 0 && (
                                    <span className="text-xs font-normal text-muted-foreground">{adminPendingCount} pending</span>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-72 overflow-y-auto pr-1">
                                {notifLoading && (
                                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">Loading…</p>
                                )}
                                {!notifLoading && pendingOrders.length === 0 && (
                                    <div className="flex flex-col items-center gap-1.5 px-2 py-6 text-center">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        <p className="text-sm text-muted-foreground">You're all caught up</p>
                                    </div>
                                )}
                                {!notifLoading &&
                                    pendingOrders.map((order) => (
                                        <DropdownMenuItem
                                            key={order.order_id}
                                            onSelect={() => openOrder(order.order_id)}
                                            className="flex items-start gap-2.5 py-2 cursor-pointer"
                                        >
                                            <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-yellow-100 dark:bg-yellow-900/30">
                                                <Package className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                            </span>
                                            <span className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium truncate">
                                                    Order #{order.order_id} · {orderCustomerName(order)}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {order.payment_method} · ₱{Number(order.total_amount).toFixed(2)}
                                                </span>
                                            </span>
                                        </DropdownMenuItem>
                                    ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
