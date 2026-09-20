import { Head, useForm, usePage, router } from '@inertiajs/react';
import { LoaderCircle, UserPlus, CheckCircle2, ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';

import { FieldHint } from '@/components/field-hint';
import InputError from '@/components/input-error';
import { PhoneInput } from '@/components/phone-input';
import PasswordConfirmationCheck from '@/components/password-confirmation-check';
import PasswordStrengthIndicator from '@/components/password-strength-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';

interface StaffAccountForm {
    username: string;
    full_name: string;
    email: string;
    contact_number: string;
    role: string;
    password: string;
    password_confirmation: string;
    [key: string]: any; // Add index signature for Inertia compatibility
}

interface CreateStaffAccountProps {
    canCreateAdmin: boolean;
}

const ROLE_LABELS: Record<string, string> = {
    cashier: 'Cashier',
    delivery_boy: 'Delivery Boy',
    Admin: 'Admin',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Staff Accounts', href: '/admin/staff-accounts' },
    { title: 'Create', href: '/admin/staff-accounts/create' },
];

export default function CreateStaffAccount({ canCreateAdmin }: CreateStaffAccountProps) {
    const { data, setData, post, processing, errors, reset } = useForm<StaffAccountForm>({
        username: '',
        full_name: '',
        email: '',
        contact_number: '',
        role: 'cashier',
        password: '',
        password_confirmation: '',
    });
    const { props } = usePage() as any;
    const flash = props.flash || {};

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.staff-accounts.store'), {
            onSuccess: () => reset(),
        });
    };

    const roleOptions = canCreateAdmin ? ['cashier', 'delivery_boy', 'Admin'] : ['cashier', 'delivery_boy'];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Staff Account - Mejeck Ice Plant" />

            <div className="space-y-6 px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Staff Account</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Directly create a Cashier, Delivery Boy, or Admin account. No self-registration or approval step is needed &mdash; the
                            account is active immediately.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit(route('admin.staff-accounts.index'))}
                        variant="outline"
                        size="sm"
                        className="border-gray-200 dark:border-gray-700 shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        View All Staff Accounts
                    </Button>
                </div>

                {flash.success && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                <div className="max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">New Staff Account</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                The new staff member can log in right away with the password you set below.
                            </p>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={submit}>
                        <div className="grid gap-2 max-w-xs">
                            <Label htmlFor="role">Role</Label>
                            <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roleOptions.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {ROLE_LABELS[role]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.role} />
                            {!canCreateAdmin && <p className="text-xs text-gray-500 dark:text-gray-400">Only a SuperAdmin can create Admin accounts.</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                            <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="username">Username</Label>
                                    <FieldHint text="Letters, numbers, and underscores only." />
                                </div>
                                <Input
                                    id="username"
                                    type="text"
                                    required
                                    autoFocus
                                    autoComplete="off"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    disabled={processing}
                                    placeholder="Choose a username"
                                />
                                <InputError message={errors.username} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    type="text"
                                    required
                                    autoComplete="off"
                                    value={data.full_name}
                                    onChange={(e) => setData('full_name', e.target.value)}
                                    disabled={processing}
                                    placeholder="Staff member's full name"
                                />
                                <InputError message={errors.full_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="off"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    disabled={processing}
                                    placeholder="staff@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="contact_number">Contact Number</Label>
                                    <FieldHint text="10-digit mobile number after +63, starting with 9." />
                                </div>
                                <PhoneInput
                                    id="contact_number"
                                    value={data.contact_number}
                                    onChange={(value) => setData('contact_number', value)}
                                    disabled={processing}
                                />
                                <InputError message={errors.contact_number} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    disabled={processing}
                                    placeholder="Set a temporary password"
                                />
                                <InputError message={errors.password} />
                                <PasswordStrengthIndicator password={data.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    autoComplete="new-password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    disabled={processing}
                                    placeholder="Re-enter the password"
                                />
                                <InputError message={errors.password_confirmation} />
                                <PasswordConfirmationCheck password={data.password} passwordConfirmation={data.password_confirmation} />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6" disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                Create Account
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppSidebarLayout>
    );
}
