import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Package, 
    Plus, 
    Edit, 
    Send, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Calendar,
    Truck,
    DollarSign,
    Search,
    Filter,
    X,
    Eye,
    RefreshCw,
    ArrowDown,
    ArrowUp
} from 'lucide-react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { showToast } from '@/lib/toast';
import { getCsrfHeaders } from '@/lib/csrf';

// A failed request here can come back either as {success:false, message} from
// this page's own controller logic, or as Laravel's default validation-error
// shape ({message, errors: {field: [...]}}) when $request->validate() itself
// rejects the payload — that shape has no top-level, human-useful message
// (just "The given data was invalid."), so pull the first field-specific
// error out of `errors` when present instead of falling through to the
// generic fallback.
function firstErrorMessage(data: any, fallback: string): string {
    const firstFieldError = data?.errors && Object.values(data.errors)[0];
    return (Array.isArray(firstFieldError) ? firstFieldError[0] : null) || data?.message || fallback;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier: string;
    supplier_id: number;
    order_date: string;
    expected_delivery_date: string;
    status: 'pending' | 'sent' | 'partial_received' | 'received' | 'cancelled';
    total_amount: number;
    final_amount: number;
    total_quantity_ordered: number;
    total_quantity_received: number;
    remaining_quantity: number;
    is_fully_received: boolean;
    is_partially_received: boolean;
    created_by: string;
    created_at: string;
    items?: Array<{
        id: number;
        product_id: number;
        quantity_ordered: number;
        quantity_received: number;
        unit_cost: number;
        total_cost: number;
        product?: {
            product_name: string;
        };
    }>;
}

interface Product {
    product_id: number;
    product_name: string;
    category_name: string;
    current_quantity: number;
    min_stock_level: number;
    price: number;
    unit: string;
}

interface PurchaseOrdersProps {
    purchase_orders: PurchaseOrder[];
}

// Empty: the top nav/sidebar already shows which page is active, and
// the page has its own heading below, so a "Dashboard > X" trail here was
// just repeating both without adding a real path back anywhere new.
const breadcrumbs: BreadcrumbItem[] = [];

export default function PurchaseOrders({ purchase_orders: initialPurchaseOrders }: PurchaseOrdersProps) {

    // Arriving from Inventory's "Order Stock" button (?product_id=...): hide the list
    // behind a loading state so the Create PO modal opens directly, instead of flashing
    // the list first while products are still being fetched.
    const [isDeepLinking, setIsDeepLinking] = useState(
        () => new URLSearchParams(window.location.search).has('product_id')
    );
    const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoaded, setProductsLoaded] = useState(false);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'sent' | 'partial_received' | 'received' | 'cancelled'>('all');
    // Newest-first by default; sorts by id (creation order) rather than the
    // display-formatted date strings, which don't sort correctly as text.
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [loading, setLoading] = useState(false);
    // Centered confirm() replacement, used for "cancel this purchase order?" below.
    const { confirm, confirmModalProps } = useConfirmModal();
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productSearchOpen, setProductSearchOpen] = useState(false);

    // Close the Create Purchase Order modal with the Escape key.
    useEffect(() => {
        if (!showAddModal) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowAddModal(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showAddModal]);

    // Close the Receive Items / Purchase Order Details modals with the Escape key.
    useEffect(() => {
        if (!showReceiveModal && !showDetailsModal) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (showReceiveModal) setShowReceiveModal(false);
            else if (showDetailsModal) setShowDetailsModal(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showReceiveModal, showDetailsModal]);

    // With only one active supplier, there's nothing to choose — auto-select it so the
    // field can render as a locked value instead of a one-option dropdown. Once a second
    // supplier is added, this no-ops and the picker takes over normally.
    useEffect(() => {
        if (showAddModal && suppliers.length === 1 && !formData.supplier_id) {
            setFormData((prev) => ({ ...prev, supplier_id: (suppliers[0] as any).id.toString() }));
        }
    }, [showAddModal, suppliers]);

    const [formData, setFormData] = useState({
        supplier_id: '',
        expected_delivery_date: '',
        tax_amount: 0,
        shipping_cost: 0,
        notes: '',
        items: [] as Array<{
            product_id: number;
            quantity_ordered: number;
            unit_cost: number;
            total_cost: number;
        }>
    });

    const [receiveFormData, setReceiveFormData] = useState({
        items: [] as Array<{
            purchase_order_item_id: number;
            quantity_received: number;
        }>
    });

    // Pre-fill Expected Delivery Date from the chosen supplier's lead time (e.g. "3-5 days"
    // becomes today + 5 days — the longer end, so the estimate isn't overly optimistic).
    // Only suggests a value; it never overwrites a date the admin already picked.
    useEffect(() => {
        if (!showAddModal || !formData.supplier_id || formData.expected_delivery_date) return;
        const supplier = suppliers.find((s: any) => s.id.toString() === formData.supplier_id) as any;
        const dayNumbers = supplier?.delivery_lead_time?.match(/\d+/g)?.map(Number) as number[] | undefined;
        if (!dayNumbers || dayNumbers.length === 0) return;
        const leadDays = Math.max(...dayNumbers);
        const suggestedDate = new Date();
        suggestedDate.setDate(suggestedDate.getDate() + leadDays);
        // Build the YYYY-MM-DD string from local date parts — toISOString() converts to
        // UTC first, which silently rolls the date back a day for any timezone ahead of
        // UTC (e.g. Philippines, UTC+8) during early-morning hours.
        const yyyy = suggestedDate.getFullYear();
        const mm = String(suggestedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(suggestedDate.getDate()).padStart(2, '0');
        setFormData((prev) => ({ ...prev, expected_delivery_date: `${yyyy}-${mm}-${dd}` }));
    }, [showAddModal, formData.supplier_id, formData.expected_delivery_date, suppliers]);

    // Tax Amount auto-calculates as 12% VAT of the order's subtotal, applied uniformly to
    // every item (no exemptions). Recomputes whenever items change, so it stays in sync as
    // products are added, removed, or edited.
    useEffect(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + item.total_cost, 0);
        const vat = Math.round(subtotal * 0.12 * 100) / 100;
        setFormData((prev) => (prev.tax_amount === vat ? prev : { ...prev, tax_amount: vat }));
    }, [formData.items]);

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
        fetchLowStockProducts();
    }, []);

    // Arriving from Inventory's "Order Stock" button (?product_id=...): pre-add that
    // product to a new PO instead of making the user find it again in this list.
    useEffect(() => {
        if (!productsLoaded) return;
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('product_id');
        if (productId) {
            const product = products.find((p) => p.product_id === Number(productId));
            if (product) {
                addOrderItem(product);
                setShowAddModal(true);
            }
            window.history.replaceState({}, '', '/admin/purchase-orders');
        }
        setIsDeepLinking(false);
    }, [productsLoaded]);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch('/admin/api/suppliers');
            const data = await response.json();
            setSuppliers(data.suppliers || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('/admin/api/purchase-orders/products');
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setProductsLoaded(true);
        }
    };

    const fetchLowStockProducts = async () => {
        try {
            const response = await fetch('/admin/api/purchase-orders/low-stock-products');
            const data = await response.json();
            setLowStockProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching low stock products:', error);
        }
    };

    const filteredPurchaseOrders = purchaseOrders.filter(po => {
        const matchesSearch = po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (po.supplier ?? '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' || po.status === filterStatus;

        return matchesSearch && matchesFilter;
    }).sort((a, b) => sortOrder === 'desc' ? b.id - a.id : a.id - b.id);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'partial_received': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'received': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'sent': return <Send className="w-4 h-4" />;
            case 'partial_received': return <RefreshCw className="w-4 h-4" />;
            case 'received': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const resetForm = () => {
        setFormData({
            supplier_id: '',
            expected_delivery_date: '',
            tax_amount: 0,
            shipping_cost: 0,
            notes: '',
            items: []
        });
        setProductSearchTerm('');
        setProductSearchOpen(false);
    };

    const addOrderItem = (product: Product) => {
        const newItem = {
            product_id: product.product_id,
            quantity_ordered: Math.max(product.min_stock_level * 2, 10),
            unit_cost: Math.round(product.price * 0.7 * 100) / 100, // 70% of selling price, rounded to centavos
            total_cost: 0
        };
        newItem.total_cost = newItem.quantity_ordered * newItem.unit_cost;
        
        setFormData({
            ...formData,
            items: [...formData.items, newItem]
        });
    };

    const removeOrderItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const updateOrderItem = (index: number, field: string, value: any) => {
        const updatedItems = [...formData.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        
        // Recalculate total cost
        if (field === 'quantity_ordered' || field === 'unit_cost') {
            updatedItems[index].total_cost = updatedItems[index].quantity_ordered * updatedItems[index].unit_cost;
        }
        
        setFormData({
            ...formData,
            items: updatedItems
        });
    };

    const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/admin/purchase-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Without this, a stale CSRF token or expired session
                    // makes Laravel respond with an HTML error page instead
                    // of JSON — response.json() then throws and the catch
                    // block below shows a useless generic message instead
                    // of what actually went wrong.
                    'Accept': 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify(formData),
            });

            if (response.status === 419) {
                alert('Your session has expired. The page will reload — please try again after it does.');
                window.location.reload();
                return;
            }

            const data = await response.json();

            if (data.success) {
                setPurchaseOrders([...purchaseOrders, data.purchase_order]);
                setShowAddModal(false);
                resetForm();
                showToast('success', 'Purchase order created.');
            } else {
                alert(firstErrorMessage(data, 'Error creating purchase order'));
            }
        } catch (error) {
            console.error('Error creating purchase order:', error);
            alert('Error creating purchase order');
        } finally {
            setLoading(false);
        }
    };

    const handleSendToSupplier = async (purchaseOrder: PurchaseOrder) => {
        try {
            const response = await fetch(`/admin/purchase-orders/${purchaseOrder.id}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Without this, a stale CSRF token or expired session
                    // makes Laravel respond with an HTML error page instead
                    // of JSON — response.json() then throws and the catch
                    // block below shows a useless generic message instead
                    // of what actually went wrong.
                    'Accept': 'application/json',
                    ...getCsrfHeaders(),
                },
            });

            if (response.status === 419) {
                alert('Your session has expired. The page will reload — please try again after it does.');
                window.location.reload();
                return;
            }

            const data = await response.json();

            if (data.success) {
                setPurchaseOrders(purchaseOrders.map(po => po.id === purchaseOrder.id ? data.purchase_order : po));
                showToast('success', 'Purchase order sent to supplier.');
            } else {
                alert(firstErrorMessage(data, 'Error sending purchase order'));
            }
        } catch (error) {
            console.error('Error sending purchase order:', error);
            alert('Error sending purchase order');
        }
    };

    const handleReceiveItems = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPurchaseOrder) return;

        setLoading(true);

        try {
            const response = await fetch(`/admin/purchase-orders/${selectedPurchaseOrder.id}/receive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Without this, a stale CSRF token or expired session
                    // makes Laravel respond with an HTML error page instead
                    // of JSON — response.json() then throws and the catch
                    // block below shows a useless generic message instead
                    // of what actually went wrong.
                    'Accept': 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify(receiveFormData),
            });

            if (response.status === 419) {
                alert('Your session has expired. The page will reload — please try again after it does.');
                window.location.reload();
                return;
            }

            const data = await response.json();

            if (data.success) {
                setPurchaseOrders(purchaseOrders.map(po => po.id === selectedPurchaseOrder.id ? data.purchase_order : po));
                setShowReceiveModal(false);
                setSelectedPurchaseOrder(null);
                setReceiveFormData({ items: [] });
                showToast('success', 'Items received and stock updated.');
            } else {
                alert(firstErrorMessage(data, 'Error receiving items'));
            }
        } catch (error) {
            console.error('Error receiving items:', error);
            alert('Error receiving items');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPurchaseOrder = async (purchaseOrder: PurchaseOrder) => {
        if (!(await confirm({ message: `Are you sure you want to cancel purchase order ${purchaseOrder.po_number}?`, danger: true }))) {
            return;
        }

        try {
            const response = await fetch(`/admin/purchase-orders/${purchaseOrder.id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Without this, a stale CSRF token or expired session
                    // makes Laravel respond with an HTML error page instead
                    // of JSON — response.json() then throws and the catch
                    // block below shows a useless generic message instead
                    // of what actually went wrong.
                    'Accept': 'application/json',
                    ...getCsrfHeaders(),
                },
            });

            if (response.status === 419) {
                alert('Your session has expired. The page will reload — please try again after it does.');
                window.location.reload();
                return;
            }

            const data = await response.json();

            if (data.success) {
                setPurchaseOrders(purchaseOrders.map(po => po.id === purchaseOrder.id ? data.purchase_order : po));
                showToast('success', 'Purchase order cancelled.');
            } else {
                alert(firstErrorMessage(data, 'Error cancelling purchase order'));
            }
        } catch (error) {
            console.error('Error cancelling purchase order:', error);
            alert('Error cancelling purchase order');
        }
    };

    const openReceiveModal = async (purchaseOrder: PurchaseOrder) => {
        try {
            const response = await fetch(`/admin/purchase-orders/${purchaseOrder.id}`);
            const data = await response.json();
            
            setSelectedPurchaseOrder(data.purchase_order);
            
            // Initialize receive form data
            const receiveItems = data.purchase_order.items.map((item: any) => ({
                purchase_order_item_id: item.id,
                quantity_received: item.quantity_received || 0
            }));
            
            setReceiveFormData({ items: receiveItems });
            setShowReceiveModal(true);
        } catch (error) {
            console.error('Error fetching purchase order details:', error);
        }
    };

    const openDetailsModal = async (purchaseOrder: PurchaseOrder) => {
        try {
            const response = await fetch(`/admin/purchase-orders/${purchaseOrder.id}`);
            const data = await response.json();
            
            setSelectedPurchaseOrder(data.purchase_order);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error fetching purchase order details:', error);
        }
    };

    const addLowStockProduct = (product: Product) => {
        addOrderItem(product);
    };

    const totalOrderAmount = formData.items.reduce((sum, item) => sum + item.total_cost, 0);
    const finalTotal = totalOrderAmount + formData.tax_amount + formData.shipping_cost;

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Orders - Mejeck Ice Plant" />

            {isDeepLinking && (
                <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-900 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Preparing purchase order…</p>
                    </div>
                </div>
            )}

            <div className="space-y-6 px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Beverage Purchase Orders</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage beverage orders from suppliers (ice is produced in-house)</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create PO</span>
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search purchase orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        title={`Currently sorted ${sortOrder === 'desc' ? 'newest first' : 'oldest first'} — click to flip it`}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition whitespace-nowrap"
                    >
                        {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                        Sort: {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                    </button>
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'pending', 'sent', 'partial_received', 'received', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status as any)}
                                className={`px-3 py-2 rounded-lg text-sm transition capitalize ${
                                    filterStatus === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Purchase Orders Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        PO Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Supplier
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Expected Delivery
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Total Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Progress
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredPurchaseOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <Package className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                            {purchaseOrders.length === 0 ? (
                                                <>
                                                    <p className="text-gray-600 dark:text-gray-300 font-medium">No purchase orders yet</p>
                                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                                        Create one to start ordering beverages from a supplier.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddModal(true)}
                                                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Create Purchase Order
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-gray-600 dark:text-gray-300 font-medium">No matching purchase orders</p>
                                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                                        Try a different search term or status filter.
                                                    </p>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                {filteredPurchaseOrders.map((po) => (
                                    <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {po.po_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {po.supplier}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(po.status)}`}>
                                                {getStatusIcon(po.status)}
                                                {(po.status ?? 'pending').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {po.expected_delivery_date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            ₱{Number(po.final_amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 max-w-20">
                                                    <div 
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${po.total_quantity_ordered > 0 ? (po.total_quantity_received / po.total_quantity_ordered) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs">
                                                    {po.total_quantity_received}/{po.total_quantity_ordered}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openDetailsModal(po)}
                                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4 text-blue-600" />
                                                </button>
                                                {po.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleSendToSupplier(po)}
                                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                                        title="Send to Supplier"
                                                    >
                                                        <Send className="w-4 h-4 text-green-600" />
                                                    </button>
                                                )}
                                                {(po.status === 'sent' || po.status === 'partial_received') && (
                                                    <button
                                                        onClick={() => openReceiveModal(po)}
                                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                                        title="Receive Items"
                                                    >
                                                        <Truck className="w-4 h-4 text-purple-600" />
                                                    </button>
                                                )}
                                                {(po.status === 'pending' || po.status === 'sent') && (
                                                    <button
                                                        onClick={() => handleCancelPurchaseOrder(po)}
                                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                                        title="Cancel PO"
                                                    >
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Purchase Order Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Beverage Purchase Order</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    title="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreatePurchaseOrder} className="space-y-4">
                                {/* Order Items comes first — it's the actual point of the PO,
                                    everything else below is order-level detail. */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Order Items *
                                    </label>

                                    {/* Searchable Add Product combobox — replaces the old plain
                                        dropdown, which was slow to scan with a long product list. */}
                                    <div className="relative mb-3">
                                        <input
                                            type="text"
                                            placeholder="Search a product to add…"
                                            value={productSearchTerm}
                                            onChange={(e) => { setProductSearchTerm(e.target.value); setProductSearchOpen(true); }}
                                            onFocus={() => setProductSearchOpen(true)}
                                            onBlur={() => setTimeout(() => setProductSearchOpen(false), 150)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                        {productSearchOpen && (() => {
                                            const matches = products.filter((product) =>
                                                product.product_name.toLowerCase().includes(productSearchTerm.toLowerCase())
                                            );
                                            return (
                                                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                                                    {matches.length > 0 ? matches.map((product) => (
                                                        <button
                                                            type="button"
                                                            key={product.product_id}
                                                            onMouseDown={() => {
                                                                addOrderItem(product);
                                                                setProductSearchTerm('');
                                                                setProductSearchOpen(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                                                        >
                                                            {product.product_name}{' '}
                                                            <span className="text-gray-400">
                                                                ({Math.floor(product.current_quantity)} {product.unit === 'CASES' ? 'CASE' : product.unit} in stock)
                                                            </span>
                                                        </button>
                                                    )) : (
                                                        <div className="px-3 py-2 text-sm text-gray-400">No matching product</div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Quick-add shortcut for low-stock items — adds to the same
                                        Order Items list as the search box above, not a separate flow. */}
                                    {lowStockProducts.length > 0 && (
                                        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                            <h3 className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                                Low on stock — quick-add to the list below
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {lowStockProducts.map((product) => (
                                                    <div key={product.product_id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded">
                                                        <div className="text-sm">
                                                            <span className="font-medium">{product.product_name}</span>
                                                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                                                                ({product.current_quantity}/{product.min_stock_level})
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => addLowStockProduct(product)}
                                                            className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {formData.items.length > 0 ? (
                                        <>
                                            <p className="text-xs text-gray-400 mb-1">
                                                Quantity and Unit Cost are pre-filled estimates — review and adjust before submitting.
                                            </p>
                                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                              <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Product</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Quantity</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Unit Cost</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Total</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {formData.items.map((item, index) => {
                                                            const product = products.find(p => p.product_id === item.product_id);
                                                            return (
                                                                <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                                                                    <td className="px-4 py-2 text-sm">
                                                                        {product?.product_name || 'Unknown Product'}
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={item.quantity_ordered}
                                                                            onChange={(e) => updateOrderItem(index, 'quantity_ordered', parseInt(e.target.value) || 0)}
                                                                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            value={item.unit_cost}
                                                                            onChange={(e) => updateOrderItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                                                                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm">
                                                                        ₱{Number(item.total_cost || 0).toFixed(2)}
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeOrderItem(index)}
                                                                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                                                        >
                                                                            <X className="w-4 h-4 text-red-600" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                              </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic px-1">
                                            No items yet — search a product above to add one.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Supplier *
                                        </label>
                                        {suppliers.length === 1 ? (
                                            <span className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-medium">
                                                {(suppliers[0] as any).supplier_name}
                                            </span>
                                        ) : (
                                            <select
                                                required
                                                value={formData.supplier_id}
                                                onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Select Supplier</option>
                                                {suppliers.map((supplier: any) => (
                                                    <option key={supplier.id} value={supplier.id}>
                                                        {supplier.supplier_name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Expected Delivery Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.expected_delivery_date}
                                            onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Tax Amount <span className="text-gray-400 font-normal">(12% VAT, auto-calculated)</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.tax_amount}
                                            onChange={(e) => setFormData({...formData, tax_amount: parseFloat(e.target.value) || 0})}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Shipping Cost
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.shipping_cost}
                                            onChange={(e) => setFormData({...formData, shipping_cost: parseFloat(e.target.value) || 0})}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                {/* Summary */}
                                {formData.items.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>₱{Number(totalOrderAmount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Tax:</span>
                                                <span>₱{Number(formData.tax_amount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Shipping:</span>
                                                <span>₱{Number(formData.shipping_cost || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-base">
                                                <span>Total:</span>
                                                <span>₱{Number(finalTotal || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3">
                                    {formData.items.length === 0 && (
                                        <span className="text-xs text-gray-400 mr-auto">Add at least one product to continue</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || formData.items.length === 0}
                                        title={formData.items.length === 0 ? 'Add at least one product first' : undefined}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {loading ? 'Creating...' : 'Create Purchase Order'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Receive Items Modal */}
                {showReceiveModal && selectedPurchaseOrder && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Receive Items - {selectedPurchaseOrder.po_number}
                                </h2>
                                <button
                                    onClick={() => setShowReceiveModal(false)}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    title="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleReceiveItems} className="space-y-4">
                                {selectedPurchaseOrder.items?.map((item: any, index: number) => (
                                    <div key={item.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {item.product?.product_name}
                                            </h4>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                Ordered: {item.quantity_ordered}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Quantity to Receive:
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.quantity_ordered - item.quantity_received}
                                                value={receiveFormData.items[index]?.quantity_received || 0}
                                                onChange={(e) => {
                                                    const updatedItems = [...receiveFormData.items];
                                                    updatedItems[index] = {
                                                        ...updatedItems[index],
                                                        quantity_received: parseInt(e.target.value) || 0
                                                    };
                                                    setReceiveFormData({ items: updatedItems });
                                                }}
                                                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            />
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                Remaining: {item.quantity_ordered - (item.quantity_received || 0)}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowReceiveModal(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                    >
                                        {loading ? 'Receiving...' : 'Receive Items'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Details Modal */}
                {showDetailsModal && selectedPurchaseOrder && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Purchase Order Details - {selectedPurchaseOrder.po_number}
                                </h2>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    title="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Order Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Order Information</h3>
                                        <dl className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">PO Number:</dt>
                                                <dd className="text-gray-900 dark:text-white">{selectedPurchaseOrder.po_number}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Supplier:</dt>
                                                <dd className="text-gray-900 dark:text-white">{selectedPurchaseOrder.supplier}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Order Date:</dt>
                                                <dd className="text-gray-900 dark:text-white">{selectedPurchaseOrder.order_date}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Expected Delivery:</dt>
                                                <dd className="text-gray-900 dark:text-white">{selectedPurchaseOrder.expected_delivery_date}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Status:</dt>
                                                <dd>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedPurchaseOrder.status)}`}>
                                                        {getStatusIcon(selectedPurchaseOrder.status)}
                                                        {(selectedPurchaseOrder.status ?? 'pending').replace('_', ' ')}
                                                    </span>
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Financial Information</h3>
                                        <dl className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Total Amount:</dt>
                                                <dd className="text-gray-900 dark:text-white">₱{Number(selectedPurchaseOrder.total_amount || 0).toFixed(2)}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Tax Amount:</dt>
                                                <dd className="text-gray-900 dark:text-white">₱{Number((selectedPurchaseOrder.final_amount || 0) - (selectedPurchaseOrder.total_amount || 0)).toFixed(2)}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Final Amount:</dt>
                                                <dd className="text-gray-900 dark:text-white font-semibold">₱{Number(selectedPurchaseOrder.final_amount || 0).toFixed(2)}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Created By:</dt>
                                                <dd className="text-gray-900 dark:text-white">{selectedPurchaseOrder.created_by}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Created At:</dt>
                                                <dd className="text-gray-900 dark:text-white">{selectedPurchaseOrder.created_at}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Order Items</h3>
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                      <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Product</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Ordered</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Received</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Unit Cost</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Total Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedPurchaseOrder.items?.map((item: any) => (
                                                    <tr key={item.id} className="border-t border-gray-200 dark:border-gray-600">
                                                        <td className="px-4 py-2 text-sm">
                                                            {item.product?.product_name || 'Unknown Product'}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {item.quantity_ordered}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {item.quantity_received}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            ₱{Number(item.unit_cost || 0).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            ₱{Number(item.total_cost || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                      </div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Delivery Progress</h3>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Items Received</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedPurchaseOrder.total_quantity_received} / {selectedPurchaseOrder.total_quantity_ordered}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                                            <div 
                                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                                style={{ width: `${(selectedPurchaseOrder.total_quantity_received / selectedPurchaseOrder.total_quantity_ordered) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            {Math.round((selectedPurchaseOrder.total_quantity_received / selectedPurchaseOrder.total_quantity_ordered) * 100)}% Complete
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal {...confirmModalProps} />
        </AppSidebarLayout>
    );
}
