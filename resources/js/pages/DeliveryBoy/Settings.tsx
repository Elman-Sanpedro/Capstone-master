import { Head, Link, usePage, useForm } from '@inertiajs/react';
import { User, Mail, Lock, Save, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { type SharedData } from '@/types';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { PhoneInput } from '@/components/phone-input';
import { PasswordInput } from '@/components/ui/password-input';

export default function DeliveryBoySettings() {
    const { auth } = usePage<SharedData>().props;
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    const profileForm = useForm({
        name: auth.user?.full_name || '',
        email: auth.user?.email || '',
        contact_number: (auth.user as any)?.contact_number || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // No manual showToast on success — the backend already flashes
    // 'success' with this exact message, which FlashToaster (mounted at the
    // app root) picks up automatically from this same Inertia visit.
    const updateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.put('/delivery-boy/settings/profile');
    };

    const updatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put('/delivery-boy/settings/password', {
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Head title="Settings - Mejeck Ice Plant" />

            {/* Header */}
            <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/LOGO.jpg"
                                alt="Mejeck Ice Plant"
                                className="w-9 h-9 rounded-lg object-cover shadow-sm"
                            />
                            <div className="flex flex-col leading-tight">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">Mejeck Ice Plant</span>
                                <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Settings</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <AppearanceToggleDropdown />
                            <Link
                                href={route('delivery-boy.dashboard')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Dashboard</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6">
                    <div className="flex gap-2 p-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                                activeTab === 'profile'
                                    ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-200'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                                activeTab === 'password'
                                    ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-200'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Password
                        </button>
                    </div>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h2>
                        <form onSubmit={updateProfile} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        className="pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                {profileForm.errors.name && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{profileForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                        className="pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full"
                                        placeholder="Enter your email address"
                                    />
                                </div>
                                {profileForm.errors.email && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{profileForm.errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Contact Number
                                </label>
                                <PhoneInput
                                    value={profileForm.data.contact_number}
                                    onChange={(value) => profileForm.setData('contact_number', value)}
                                    className="py-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                                {(profileForm.errors as any).contact_number && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{(profileForm.errors as any).contact_number}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={profileForm.processing}
                                className="flex items-center justify-center w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {profileForm.processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Change Password</h2>
                        <form onSubmit={updatePassword} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                                    <PasswordInput
                                        value={passwordForm.data.current_password}
                                        onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                        className="pl-10 pr-10 py-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus-visible:ring-cyan-500 focus:border-transparent"
                                        placeholder="Enter your current password"
                                    />
                                </div>
                                {passwordForm.errors.current_password && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordForm.errors.current_password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                                    <PasswordInput
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        className="pl-10 pr-10 py-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus-visible:ring-cyan-500 focus:border-transparent"
                                        placeholder="Enter your new password"
                                    />
                                </div>
                                {passwordForm.errors.password && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordForm.errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                                    <PasswordInput
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                        className="pl-10 pr-10 py-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus-visible:ring-cyan-500 focus:border-transparent"
                                        placeholder="Confirm your new password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="flex items-center justify-center w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {passwordForm.processing ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
