import { Head, useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';

interface DeliveryFeeSettings {
    in_town_fee: number;
    out_of_town_fee: number;
    in_town_municipality: string;
}

// Empty: the top nav/sidebar already shows which page is active, and
// the page has its own heading below, so a "Dashboard > X" trail here was
// just repeating both without adding a real path back anywhere new.
const breadcrumbs: BreadcrumbItem[] = [];

export default function DeliveryFeeSettingsPage({ settings }: { settings: DeliveryFeeSettings }) {
    const { data, setData, put, errors, processing, recentlySuccessful } = useForm({
        in_town_fee: settings.in_town_fee,
        out_of_town_fee: settings.out_of_town_fee,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/admin/delivery-fee');
    };

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title="Delivery Fee Settings - Mejeck Ice Plant" />

            <div className="space-y-6 px-4 max-w-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Delivery Fee Settings</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Set the flat delivery fee charged to customers ordering delivery, based on whether their address is inside or outside {settings.in_town_municipality}.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
                    <div className="grid gap-2">
                        <Label htmlFor="in_town_fee">In-town fee ({settings.in_town_municipality})</Label>
                        {/* ₱ prefix — every other price in the app shows the peso sign, so a bare
                            number here was the odd one out. */}
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span>
                            <Input
                                id="in_town_fee"
                                type="number"
                                min="0"
                                step="0.01"
                                className="pl-7"
                                value={data.in_town_fee}
                                onChange={(e) => setData('in_town_fee', Number(e.target.value))}
                                required
                            />
                        </div>
                        <InputError message={errors.in_town_fee} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="out_of_town_fee">Out-of-town fee (other municipalities)</Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span>
                            <Input
                                id="out_of_town_fee"
                                type="number"
                                min="0"
                                step="0.01"
                                className="pl-7"
                                value={data.out_of_town_fee}
                                onChange={(e) => setData('out_of_town_fee', Number(e.target.value))}
                                required
                            />
                        </div>
                        <InputError message={errors.out_of_town_fee} />
                    </div>

                    {/* Live example — turns the two raw numbers above into a sentence about what
                        a real customer actually pays, so a typo is easy to catch before saving. */}
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <p>
                            A customer in <span className="font-semibold">{settings.in_town_municipality}</span> pays{' '}
                            <span className="font-semibold text-slate-800 dark:text-slate-100">₱{Number(data.in_town_fee || 0).toFixed(2)}</span> for delivery.
                        </p>
                        <p>
                            A customer in <span className="font-semibold">another municipality</span> pays{' '}
                            <span className="font-semibold text-slate-800 dark:text-slate-100">₱{Number(data.out_of_town_fee || 0).toFixed(2)}</span> for delivery.
                        </p>
                    </div>

                    {/* Soft, non-blocking heads-up — doesn't stop saving, just flags a value
                        order that's almost certainly a mistake (out-of-town normally costs more). */}
                    {Number(data.out_of_town_fee) < Number(data.in_town_fee) && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>The out-of-town fee is lower than the in-town fee. Double-check this is intentional before saving.</span>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>Save</Button>
                    </div>
                </form>
            </div>

            {/* Save confirmation — centered on screen instead of a small text label next to
                the button, so it actually reads as a confirmation rather than something easy
                to miss off in the corner of the eye. No backdrop: it's transient feedback, not
                something the admin needs to acknowledge before continuing. */}
            <Transition
                show={recentlySuccessful}
                enter="transition ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-green-200 dark:border-green-700 px-8 py-6">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 shrink-0" />
                        <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">Delivery fee settings saved!</span>
                    </div>
                </div>
            </Transition>
        </AppSidebarLayout>
    );
}
