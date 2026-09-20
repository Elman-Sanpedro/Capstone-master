import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { UserPlus, CheckCircle2, XCircle, ShieldOff, ShieldCheck, Trash2, Mail, Calendar, Shield, Truck, KeyRound, LoaderCircle } from 'lucide-react';
import PesoSign from '@/components/icons/peso-sign';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import InputError from '@/components/input-error';
import PasswordStrengthIndicator from '@/components/password-strength-indicator';
import PasswordConfirmationCheck from '@/components/password-confirmation-check';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import { useConfirmModal } from '@/hooks/useConfirmModal';

interface StaffMember {
    id: number;
    username: string;
    full_name: string;
    email: string;
    role: 'cashier' | 'delivery_boy' | 'Admin';
    is_active: boolean;
    created_at: string;
    has_activity: boolean;
}

interface ManageStaffAccountsProps {
    staff: StaffMember[];
    canManageAdmins: boolean;
    currentUserId: number;
}

const ROLE_LABELS: Record<string, string> = {
    Admin: 'Admin',
    cashier: 'Cashier',
    delivery_boy: 'Delivery Boy',
};

// Fixed display order — sections always render in this order regardless of
// how the rows came back from the server.
const ROLE_ORDER = ['Admin', 'cashier', 'delivery_boy'] as const;

const ROLE_ICONS: Record<string, typeof Shield> = {
    Admin: Shield,
    cashier: PesoSign,
    delivery_boy: Truck,
};

// Empty: the top nav/sidebar already shows which page is active, and
// the page has its own heading below, so a "Dashboard > X" trail here was
// just repeating both without adding a real path back anywhere new.
const breadcrumbs: BreadcrumbItem[] = [];

interface ResetPasswordForm {
    password: string;
    password_confirmation: string;
    [key: string]: any;
}

export default function ManageStaffAccounts({ staff, canManageAdmins, currentUserId }: ManageStaffAccountsProps) {
    const { props } = usePage() as any;
    const flash = props.flash || {};
    // Centered confirm() replacement, used for the two prompts below.
    const { confirm, confirmModalProps } = useConfirmModal();

    // Passwords are one-way hashed — there is no existing password to show,
    // only the option to set a new one and tell the staff member directly.
    const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
    const resetForm = useForm<ResetPasswordForm>({ password: '', password_confirmation: '' });

    const closeResetModal = () => {
        setResetTarget(null);
        resetForm.reset();
        resetForm.clearErrors();
    };

    const submitResetPassword: FormEventHandler = (e) => {
        e.preventDefault();
        if (!resetTarget) return;
        resetForm.put(route('admin.staff-accounts.reset-password', resetTarget.id), {
            preserveScroll: true,
            onSuccess: () => closeResetModal(),
        });
    };

    const handleToggleActive = async (member: StaffMember) => {
        const verb = member.is_active ? 'deactivate' : 'activate';
        if (await confirm(`Are you sure you want to ${verb} ${member.full_name}'s account?`)) {
            router.put(route('admin.staff-accounts.toggle-active', member.id));
        }
    };

    const handleDelete = async (member: StaffMember) => {
        if (await confirm({ message: `Permanently delete ${member.full_name}'s account? This cannot be undone.`, danger: true })) {
            router.delete(route('admin.staff-accounts.destroy', member.id));
        }
    };

    const canManage = (member: StaffMember) => member.role !== 'Admin' || canManageAdmins;

    const groupedByRole = ROLE_ORDER.map((role) => ({
        role,
        members: staff.filter((member) => member.role === role),
    })).filter((group) => group.members.length > 0);

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff Accounts - Mejeck Ice Plant" />

            <div className="space-y-6 px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Accounts</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage Cashier, Delivery Boy, and Admin accounts</p>
                    </div>
                    <Button
                        onClick={() => router.visit(route('admin.staff-accounts.create'))}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <UserPlus className="w-4 h-4" />
                        Create Account
                    </Button>
                </div>

                {flash.success && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {staff.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 flex flex-col items-center text-center">
                        <UserPlus className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Staff Accounts Yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md">
                            Create a Cashier, Delivery Boy, or Admin account to see it listed here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {groupedByRole.map(({ role, members }) => {
                            const RoleIcon = ROLE_ICONS[role];
                            return (
                                <div key={role}>
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                                        <RoleIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{ROLE_LABELS[role]}</h2>
                                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                                            {members.length}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {members.map((member) => (
                                            <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">{member.full_name}</h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">@{member.username}</p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            member.is_active
                                                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                                                                : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                                                        }
                                                    >
                                                        {member.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <Mail className="w-4 h-4 shrink-0" />
                                                        <span className="truncate">{member.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <Calendar className="w-4 h-4 shrink-0" />
                                                        <span>Created {member.created_at}</span>
                                                    </div>
                                                </div>

                                                {member.id === currentUserId ? (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">This is your own account.</p>
                                                ) : !canManage(member) ? (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">Only a SuperAdmin can manage Admin accounts.</p>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleToggleActive(member)}
                                                            variant="outline"
                                                            size="sm"
                                                            className={
                                                                member.is_active
                                                                    ? 'flex-1 text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/20'
                                                                    : 'flex-1 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20'
                                                            }
                                                        >
                                                            {member.is_active ? (
                                                                <>
                                                                    <ShieldOff className="w-4 h-4 mr-1" />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShieldCheck className="w-4 h-4 mr-1" />
                                                                    Activate
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            onClick={() => setResetTarget(member)}
                                                            variant="outline"
                                                            size="sm"
                                                            title="Set a new password for this account"
                                                            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                                                        >
                                                            <KeyRound className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDelete(member)}
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={member.has_activity}
                                                            title={member.has_activity ? 'Has sales/delivery/stock records — deactivate instead' : 'Delete account'}
                                                            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 disabled:opacity-40"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ConfirmModal {...confirmModalProps} />

            {resetTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Reset Password</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Set a new password for <span className="font-medium">{resetTarget.full_name}</span> (@{resetTarget.username}). Tell them
                            the new password directly &mdash; it won't be shown again.
                        </p>
                        <form className="space-y-4" onSubmit={submitResetPassword}>
                            <div className="grid gap-2">
                                <Label htmlFor="reset_password">New Password</Label>
                                <PasswordInput
                                    id="reset_password"
                                    required
                                    autoFocus
                                    autoComplete="new-password"
                                    value={resetForm.data.password}
                                    onChange={(e) => resetForm.setData('password', e.target.value)}
                                    disabled={resetForm.processing}
                                    placeholder="Set a new password"
                                />
                                <InputError message={resetForm.errors.password} />
                                <PasswordStrengthIndicator password={resetForm.data.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="reset_password_confirmation">Confirm New Password</Label>
                                <PasswordInput
                                    id="reset_password_confirmation"
                                    required
                                    autoComplete="new-password"
                                    value={resetForm.data.password_confirmation}
                                    onChange={(e) => resetForm.setData('password_confirmation', e.target.value)}
                                    disabled={resetForm.processing}
                                    placeholder="Re-enter the new password"
                                />
                                <InputError message={resetForm.errors.password_confirmation} />
                                <PasswordConfirmationCheck password={resetForm.data.password} passwordConfirmation={resetForm.data.password_confirmation} />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeResetModal}
                                    disabled={resetForm.processing}
                                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetForm.processing}
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resetForm.processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                    Set Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppSidebarLayout>
    );
}
