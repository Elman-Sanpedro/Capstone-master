import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User | null;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    roles?: string[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    cashier_pending_count: number | null;
    admin_pending_count: number | null;
    admin_low_stock_count: number | null;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name?: string;
    full_name?: string;
    email: string;
    avatar?: string;
    birthdate?: string | null;
    age?: number | null;
    is_adult?: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
