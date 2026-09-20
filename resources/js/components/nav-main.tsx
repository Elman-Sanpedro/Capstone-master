import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const currentUser = (page.props.auth as any)?.user;

    // The admin Dashboard page switches between its Dashboard/Inventory/Settings sections
    // via a URL hash (e.g. clicking a stat card just sets window.location.hash), not a real
    // Inertia visit — so page.url never changes and can't tell those sections apart on its
    // own. Track the hash here too so the sidebar highlight follows whichever section is
    // actually showing, not just whichever full page was last navigated to.
    const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''));

    useEffect(() => {
        const onHashChange = () => setHash(window.location.hash);
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    // Re-sync whenever Inertia swaps to a different page, since the new page may load
    // with no hash (or a different one) that the 'hashchange' event alone wouldn't catch.
    useEffect(() => {
        setHash(typeof window !== 'undefined' ? window.location.hash : '');
    }, [page.url]);

    const currentPath = page.url.split('?')[0];
    const effectiveHash = hash.replace('#', '') || 'dashboard';
    // Only the admin dashboard route actually uses section hashes; everywhere else the
    // hash is meaningless, so comparing the plain path keeps every other page's highlight
    // working exactly as before.
    const currentUrl = currentPath === '/admin/dashboard' ? `${currentPath}#${effectiveHash}` : currentPath;

    // Filter navigation items based on user roles
    const filteredItems = items.filter((item) => {
        if (!item.roles || item.roles.length === 0) {
            return true; // Show items without role restrictions
        }
        return item.roles.includes(currentUser?.role || '');
    });

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {filteredItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={item.url === currentUrl}>
                            <Link href={item.url} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
