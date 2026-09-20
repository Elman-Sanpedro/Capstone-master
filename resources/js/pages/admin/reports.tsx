import { Head } from '@inertiajs/react';
import { useState, type ComponentType } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Package, Calendar, ChevronDown, Download, FileText, Table, Users, ShoppingCart, Truck, Boxes } from 'lucide-react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';
import PesoSign from '@/components/icons/peso-sign';

interface MovingProduct {
    product_id: number;
    product_name: string;
    category_name: string;
    price: number;
    total_sold: number;
    total_revenue: number;
    order_count: number;
    last_sale_date: string;
}

interface NonMovingProduct {
    product_id: number;
    product_name: string;
    category_name: string;
    price: number;
    current_quantity: number;
    min_stock_level: number;
    total_sold: number;
    product_added_date: string;
}

interface SalesReport {
    summary: {
        total_revenue: number;
        total_sales: number;
        average_sale: number;
    };
    trend: { date: string; revenue: number; sales_count: number }[];
    paymentBreakdown: { payment_method: string; count: number; revenue: number }[];
}

interface CustomerReport {
    summary: {
        new_customers: number;
        active_customers: number;
    };
    topCustomers: {
        user_id: number;
        full_name: string;
        email: string;
        total_orders: number;
        total_spent: number;
    }[];
}

interface OrdersReport {
    summary: {
        total_orders: number;
        cancelled_orders: number;
        total_value: number;
        average_order_value: number;
    };
    statusBreakdown: { status: string; count: number }[];
    typeBreakdown: { order_type: string; count: number }[];
    trend: { date: string; count: number }[];
}

interface DeliveryReport {
    summary: {
        total_deliveries: number;
        delivered: number;
        failed: number;
        completion_rate: number;
    };
    statusBreakdown: { delivery_status: string; count: number }[];
    riderPerformance: {
        rider_id: number;
        rider_name: string;
        assigned: number;
        delivered: number;
        failed: number;
    }[];
}

interface ReportsProps {
    movingProducts: MovingProduct[];
    nonMovingProducts: NonMovingProduct[];
    categories: string[];
    filters: {
        category: string;
        days: number | string;
        start_date?: string;
        end_date?: string;
    };
    salesReport: SalesReport;
    customerReport: CustomerReport;
    ordersReport: OrdersReport;
    deliveryReport: DeliveryReport;
}

type ReportTab = 'inventory' | 'sales' | 'customers' | 'orders' | 'delivery';

// Small stat tile shared by every tab — matches the gradient tile style the
// Inventory tab already used for its two summary cards.
function StatTile({ label, value, sub, icon: Icon, from, to, iconColor }: {
    label: string;
    value: string | number;
    sub?: string;
    icon: ComponentType<{ className?: string }>;
    from: string;
    to: string;
    iconColor: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${from} ${to} rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
            <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{value}</div>
                {sub && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}

// Empty: the top nav/sidebar already shows which page is active, and
// the page has its own heading below, so a "Dashboard > X" trail here was
// just repeating both without adding a real path back anywhere new.
const breadcrumbs: BreadcrumbItem[] = [];

const dateFilterOptions = [
    { value: '1', label: 'Last 1 Day' },
    { value: '2', label: 'Last 2 Days' },
    { value: '7', label: 'Last 7 Days' },
    { value: '14', label: 'Last 14 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' },
];

export default function Reports({
    movingProducts,
    nonMovingProducts,
    categories,
    filters,
    salesReport,
    customerReport,
    ordersReport,
    deliveryReport,
}: ReportsProps) {
    const [activeTab, setActiveTab] = useState<ReportTab>('inventory');
    const [selectedDateFilter, setSelectedDateFilter] = useState(String(filters.days));
    const [selectedCategory, setSelectedCategory] = useState(filters.category);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(filters.start_date || '');
    const [customEndDate, setCustomEndDate] = useState(filters.end_date || '');

    // Initialize custom date inputs if custom range is active
    if (filters.days === 'custom' && filters.start_date && filters.end_date && !showCustomDateInputs) {
        setShowCustomDateInputs(true);
    }
    // Prepare data for charts
    const movingProductsChartData = movingProducts.slice(0, 10).map(p => ({
        name: p.product_name.length > 20 ? p.product_name.substring(0, 20) + '...' : p.product_name,
        sold: p.total_sold,
    }));

    const nonMovingProductsChartData = nonMovingProducts.slice(0, 10).map(p => ({
        name: p.product_name.length > 20 ? p.product_name.substring(0, 20) + '...' : p.product_name,
        stock: p.current_quantity,
        value: p.price * p.current_quantity,
    }));

    const totalMovingRevenue = movingProducts.reduce((sum, p) => sum + Number(p.total_revenue), 0);
    const totalNonMovingStockValue = nonMovingProducts.reduce((sum, p) => sum + (p.price * p.current_quantity), 0);

    const formatShortDate = (dateStr: string) =>
        new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const salesTrendChartData = salesReport.trend.map(t => ({
        date: formatShortDate(t.date),
        revenue: Number(t.revenue),
        sales: t.sales_count,
    }));

    const ordersTrendChartData = ordersReport.trend.map(t => ({
        date: formatShortDate(t.date),
        orders: t.count,
    }));

    const tabs: { key: ReportTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
        { key: 'inventory', label: 'Inventory', icon: Boxes },
        { key: 'sales', label: 'Sales', icon: PesoSign },
        { key: 'customers', label: 'Customers', icon: Users },
        { key: 'orders', label: 'Orders', icon: ShoppingCart },
        { key: 'delivery', label: 'Delivery', icon: Truck },
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports - Mejeck Ice Plant" />
            
            <div className="space-y-8 px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Track inventory, sales, customers, orders, and delivery performance</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Export Buttons — exports everything at once, so this is the one pair
                            that stays solid/filled; the per-section buttons below are outlined
                            to read as the lighter, scoped-down option instead of a third
                            identical set. Inventory-only: the export shape is specific to
                            movingProducts/nonMovingProducts, nothing to export elsewhere yet. */}
                        {activeTab === 'inventory' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => exportToCSV({ movingProducts, nonMovingProducts, filters }, 'both')}
                                disabled={movingProducts.length === 0 && nonMovingProducts.length === 0}
                                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                                title={movingProducts.length === 0 && nonMovingProducts.length === 0 ? 'No products to export' : 'Export to CSV'}
                            >
                                <Table className="w-4 h-4" />
                                <span>CSV</span>
                            </button>
                            <button
                                onClick={() => exportToPDF({ movingProducts, nonMovingProducts, filters }, 'both')}
                                disabled={movingProducts.length === 0 && nonMovingProducts.length === 0}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                                title={movingProducts.length === 0 && nonMovingProducts.length === 0 ? 'No products to export' : 'Export to PDF'}
                            >
                                <FileText className="w-4 h-4" />
                                <span>PDF</span>
                            </button>
                        </div>
                        )}

                        {/* Category Filter — inventory-only, the other tabs aren't scoped by product category */}
                        {activeTab === 'inventory' && (
                        <div className="relative">
                            <button
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition shadow-sm text-sm sm:text-base"
                            >
                                <Package className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">
                                    {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
                                </span>
                                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>

                            {showCategoryDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setSelectedCategory('all');
                                                setShowCategoryDropdown(false);
                                                window.location.href = `/admin/reports?category=all&days=${selectedDateFilter}`;
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                                        >
                                            All Categories
                                        </button>
                                        {categories.filter(cat => cat === 'Ice Tubes' || cat === 'Beverages').map((category) => (
                                            <button
                                                key={category}
                                                onClick={() => {
                                                    setSelectedCategory(category);
                                                    setShowCategoryDropdown(false);
                                                    window.location.href = `/admin/reports?category=${category}&days=${selectedDateFilter}`;
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        )}

                        {/* Date Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDateDropdown(!showDateDropdown)}
                                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition shadow-sm text-sm sm:text-base"
                            >
                                <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">
                                    {selectedDateFilter === 'custom' && customStartDate && customEndDate 
                                        ? `${customStartDate} to ${customEndDate}` 
                                        : dateFilterOptions.find(opt => opt.value === selectedDateFilter)?.label || 'Last 30 Days'}
                                </span>
                                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>

                            {showDateDropdown && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                    <div className="py-1">
                                        {dateFilterOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    if (option.value === 'custom') {
                                                        setSelectedDateFilter('custom');
                                                        setShowDateDropdown(false);
                                                        setShowCustomDateInputs(true);
                                                    } else {
                                                        setSelectedDateFilter(option.value);
                                                        setShowDateDropdown(false);
                                                        setShowCustomDateInputs(false);
                                                        window.location.href = `/admin/reports?category=${selectedCategory}&days=${option.value}`;
                                                    }
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Custom Date Range Inputs */}
                            {showCustomDateInputs && (
                                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-4">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                            <input
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => {
                                                    if (customStartDate && customEndDate) {
                                                        setShowCustomDateInputs(false);
                                                        window.location.href = `/admin/reports?category=${selectedCategory}&start_date=${customStartDate}&end_date=${customEndDate}`;
                                                    }
                                                }}
                                                disabled={!customStartDate || !customEndDate}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                                            >
                                                Apply
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowCustomDateInputs(false);
                                                    setSelectedDateFilter('30');
                                                    setCustomStartDate('');
                                                    setCustomEndDate('');
                                                }}
                                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900/40 dark:to-slate-800/40 rounded-xl shadow-sm border border-slate-200 dark:border-slate-500/50">
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4 p-4 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-none ${
                                    activeTab === tab.key
                                        ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-200'
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Cards */}
                {activeTab === 'inventory' && (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-cyan-200/50 dark:border-cyan-700/50 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-xl"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Moving Products</span>
                                </div>
                            </div>
                            <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{movingProducts.length}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">₱{totalMovingRevenue.toFixed(2)} revenue</div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-rose-200/50 dark:border-rose-700/50 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-xl"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Non-Moving</span>
                                </div>
                            </div>
                            <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{nonMovingProducts.length}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">₱{totalNonMovingStockValue.toFixed(2)} stock value</div>
                        </div>
                    </div>
                </div>

                {/* All Charts and Tables in 2x2 Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Moving Products Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-8 hover:shadow-xl transition-shadow flex flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-md shadow-cyan-500/20 flex-shrink-0">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Moving Products</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {selectedDateFilter === 'custom' && customStartDate && customEndDate
                                        ? `Best-selling products from ${customStartDate} to ${customEndDate}`
                                        : `Best-selling products in the last ${dateFilterOptions.find(opt => opt.value === selectedDateFilter)?.label?.replace('Last ', '').toLowerCase() || '30 days'}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Scoped to just this section's data — kept visually lighter (outline,
                                not filled) than the "export everything" buttons up in the page
                                header, and disabled when there's nothing here to export. */}
                            <button
                                onClick={() => exportToCSV({ movingProducts, nonMovingProducts, filters }, 'moving')}
                                disabled={movingProducts.length === 0}
                                className="flex items-center gap-2 px-3 py-2 border border-green-600 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title={movingProducts.length === 0 ? 'No moving products to export' : 'Export Moving Products to CSV'}
                            >
                                <Table className="w-4 h-4" />
                                <span>CSV</span>
                            </button>
                            <button
                                onClick={() => exportToPDF({ movingProducts, nonMovingProducts, filters }, 'moving')}
                                disabled={movingProducts.length === 0}
                                className="flex items-center gap-2 px-3 py-2 border border-blue-600 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title={movingProducts.length === 0 ? 'No moving products to export' : 'Export Moving Products to PDF'}
                            >
                                <FileText className="w-4 h-4" />
                                <span>PDF</span>
                            </button>
                            <span className="px-4 py-2 bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-200 rounded-full text-sm font-semibold">{movingProducts.length} products</span>
                        </div>
                    </div>

                    {movingProductsChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={movingProductsChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tick={{ fill: '#6b7280' }} />
                                <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#6b7280' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', padding: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="sold" name="Units Sold" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 min-h-[280px] flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500">
                            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg font-medium text-gray-900 dark:text-white">No moving products data available</p>
                            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Add products and create sales to see data here</p>
                        </div>
                    )}
                </div>

                {/* Non-Moving Products Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-8 hover:shadow-xl transition-shadow flex flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-md shadow-rose-500/20 flex-shrink-0">
                                <TrendingDown className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Non-Moving Products</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {selectedDateFilter === 'custom' && customStartDate && customEndDate
                                        ? `Products with no sales from ${customStartDate} to ${customEndDate}`
                                        : `Products with no sales in ${dateFilterOptions.find(opt => opt.value === selectedDateFilter)?.label?.replace('Last ', '').toLowerCase() || '30 days'}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Scoped to just this section's data — same lighter/outline
                                treatment as the Moving panel, disabled when there's nothing
                                here to export (this list is empty far more often). */}
                            <button
                                onClick={() => exportToCSV({ movingProducts, nonMovingProducts, filters }, 'nonMoving')}
                                disabled={nonMovingProducts.length === 0}
                                className="flex items-center gap-2 px-3 py-2 border border-green-600 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title={nonMovingProducts.length === 0 ? 'No non-moving products to export' : 'Export Non-Moving Products to CSV'}
                            >
                                <Table className="w-4 h-4" />
                                <span>CSV</span>
                            </button>
                            <button
                                onClick={() => exportToPDF({ movingProducts, nonMovingProducts, filters }, 'nonMoving')}
                                disabled={nonMovingProducts.length === 0}
                                className="flex items-center gap-2 px-3 py-2 border border-blue-600 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title={nonMovingProducts.length === 0 ? 'No non-moving products to export' : 'Export Non-Moving Products to PDF'}
                            >
                                <FileText className="w-4 h-4" />
                                <span>PDF</span>
                            </button>
                            <span className="px-4 py-2 bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200 rounded-full text-sm font-semibold">{nonMovingProducts.length} products</span>
                        </div>
                    </div>

                    {nonMovingProductsChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={nonMovingProductsChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tick={{ fill: '#6b7280' }} />
                                <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#6b7280' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', padding: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="stock" name="Stock Level" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="value" name="Stock Value (₱)" fill="#ec4899" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 min-h-[280px] flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500">
                            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg font-medium text-gray-900 dark:text-white">All products are moving!</p>
                            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Great job keeping your inventory active</p>
                        </div>
                    )}
                </div>
            </div>
                </>
                )}

            {/* Sales tab */}
            {activeTab === 'sales' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatTile
                            label="Total Revenue"
                            value={`₱${salesReport.summary.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            sub={`${salesReport.summary.total_sales} sale${salesReport.summary.total_sales === 1 ? '' : 's'}`}
                            icon={PesoSign}
                            from="from-emerald-50" to="to-green-50 dark:from-emerald-900/20 dark:to-green-900/20"
                            iconColor="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatTile
                            label="Total Sales"
                            value={salesReport.summary.total_sales}
                            sub="confirmed transactions"
                            icon={Table}
                            from="from-cyan-50" to="to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20"
                            iconColor="text-cyan-600 dark:text-cyan-400"
                        />
                        <StatTile
                            label="Average Sale"
                            value={`₱${salesReport.summary.average_sale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            sub="per transaction"
                            icon={TrendingUp}
                            from="from-violet-50" to="to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20"
                            iconColor="text-violet-600 dark:text-violet-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-8 hover:shadow-xl transition-shadow flex flex-col">
                            <div className="flex items-center mb-8">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-4 shadow-md shadow-emerald-500/20 flex-shrink-0">
                                    <PesoSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Trend</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Confirmed sales revenue by day</p>
                                </div>
                            </div>
                            {salesTrendChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={salesTrendChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tick={{ fill: '#6b7280' }} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#6b7280' }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', padding: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenue" name="Revenue (₱)" fill="#10b981" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="sales" name="Sales Count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex-1 min-h-[280px] flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500">
                                    <PesoSign className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">No sales in this period</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-shadow">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h2>
                            {salesReport.paymentBreakdown.length > 0 ? (
                                <div className="space-y-3">
                                    {salesReport.paymentBreakdown.map((row) => (
                                        <div key={row.payment_method} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{row.payment_method}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{row.count} sale{row.count === 1 ? '' : 's'}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">₱{Number(row.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No data for this period</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Customers tab */}
            {activeTab === 'customers' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatTile
                            label="New Customers"
                            value={customerReport.summary.new_customers}
                            sub="signed up this period"
                            icon={Users}
                            from="from-cyan-50" to="to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20"
                            iconColor="text-cyan-600 dark:text-cyan-400"
                        />
                        <StatTile
                            label="Active Customers"
                            value={customerReport.summary.active_customers}
                            sub="placed an order this period"
                            icon={TrendingUp}
                            from="from-violet-50" to="to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20"
                            iconColor="text-violet-600 dark:text-violet-400"
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-8 hover:shadow-xl transition-shadow">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-md shadow-cyan-500/20 flex-shrink-0">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Customers</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Highest spenders in this period</p>
                            </div>
                        </div>

                        {customerReport.topCustomers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                            <th className="pb-2 font-medium">Customer</th>
                                            <th className="pb-2 font-medium">Orders</th>
                                            <th className="pb-2 font-medium text-right">Total Spent</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {customerReport.topCustomers.map((c) => (
                                            <tr key={c.user_id}>
                                                <td className="py-3">
                                                    <p className="font-medium text-gray-900 dark:text-white">{c.full_name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
                                                </td>
                                                <td className="py-3 text-gray-700 dark:text-gray-300">{c.total_orders}</td>
                                                <td className="py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                    ₱{Number(c.total_spent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <p className="text-lg font-medium text-gray-900 dark:text-white">No customer orders in this period</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Orders tab */}
            {activeTab === 'orders' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatTile
                            label="Total Orders"
                            value={ordersReport.summary.total_orders}
                            icon={ShoppingCart}
                            from="from-cyan-50" to="to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20"
                            iconColor="text-cyan-600 dark:text-cyan-400"
                        />
                        <StatTile
                            label="Cancelled"
                            value={ordersReport.summary.cancelled_orders}
                            icon={TrendingDown}
                            from="from-rose-50" to="to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20"
                            iconColor="text-rose-600 dark:text-rose-400"
                        />
                        <StatTile
                            label="Total Value"
                            value={`₱${ordersReport.summary.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            sub="excludes cancelled"
                            icon={PesoSign}
                            from="from-emerald-50" to="to-green-50 dark:from-emerald-900/20 dark:to-green-900/20"
                            iconColor="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatTile
                            label="Avg Order Value"
                            value={`₱${ordersReport.summary.average_order_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            icon={TrendingUp}
                            from="from-violet-50" to="to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20"
                            iconColor="text-violet-600 dark:text-violet-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-8 hover:shadow-xl transition-shadow flex flex-col">
                            <div className="flex items-center mb-8">
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-md shadow-cyan-500/20 flex-shrink-0">
                                    <ShoppingCart className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Orders Trend</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Order volume by day (all statuses)</p>
                                </div>
                            </div>
                            {ordersTrendChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={ordersTrendChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tick={{ fill: '#6b7280' }} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#6b7280' }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', padding: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="orders" name="Orders" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex-1 min-h-[280px] flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500">
                                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">No orders in this period</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-shadow">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">By Status</h2>
                                <div className="space-y-2">
                                    {ordersReport.statusBreakdown.map((row) => (
                                        <div key={row.status} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{row.status}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{row.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-shadow">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">By Type</h2>
                                <div className="space-y-2">
                                    {ordersReport.typeBreakdown.map((row) => (
                                        <div key={row.order_type} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300 capitalize">{row.order_type}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{row.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery tab */}
            {activeTab === 'delivery' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatTile
                            label="Total Deliveries"
                            value={deliveryReport.summary.total_deliveries}
                            icon={Truck}
                            from="from-cyan-50" to="to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20"
                            iconColor="text-cyan-600 dark:text-cyan-400"
                        />
                        <StatTile
                            label="Delivered"
                            value={deliveryReport.summary.delivered}
                            icon={TrendingUp}
                            from="from-emerald-50" to="to-green-50 dark:from-emerald-900/20 dark:to-green-900/20"
                            iconColor="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatTile
                            label="Failed"
                            value={deliveryReport.summary.failed}
                            icon={TrendingDown}
                            from="from-rose-50" to="to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20"
                            iconColor="text-rose-600 dark:text-rose-400"
                        />
                        <StatTile
                            label="Completion Rate"
                            value={`${deliveryReport.summary.completion_rate}%`}
                            icon={Truck}
                            from="from-violet-50" to="to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20"
                            iconColor="text-violet-600 dark:text-violet-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-shadow">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">By Status</h2>
                            {deliveryReport.statusBreakdown.length > 0 ? (
                                <div className="space-y-2">
                                    {deliveryReport.statusBreakdown.map((row) => (
                                        <div key={row.delivery_status} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{row.delivery_status}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{row.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No deliveries in this period</p>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-shadow">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Rider Performance</h2>
                            {deliveryReport.riderPerformance.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                                <th className="pb-2 font-medium">Rider</th>
                                                <th className="pb-2 font-medium text-right">Assigned</th>
                                                <th className="pb-2 font-medium text-right">Delivered</th>
                                                <th className="pb-2 font-medium text-right">Failed</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {deliveryReport.riderPerformance.map((r) => (
                                                <tr key={r.rider_id}>
                                                    <td className="py-3 font-medium text-gray-900 dark:text-white">{r.rider_name}</td>
                                                    <td className="py-3 text-right text-gray-700 dark:text-gray-300">{r.assigned}</td>
                                                    <td className="py-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{Number(r.delivered)}</td>
                                                    <td className="py-3 text-right text-rose-600 dark:text-rose-400 font-semibold">{Number(r.failed)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No rider activity in this period</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            </div>
        </AppSidebarLayout>
    );
}
