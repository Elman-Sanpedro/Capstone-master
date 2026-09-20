<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeliveryFeeSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeliveryFeeSettingController extends Controller
{
    public function edit(): Response
    {
        $settings = DeliveryFeeSetting::current();

        return Inertia::render('admin/delivery-fee', [
            'settings' => [
                'in_town_fee' => (float) $settings->in_town_fee,
                'out_of_town_fee' => (float) $settings->out_of_town_fee,
                'in_town_municipality' => DeliveryFeeSetting::IN_TOWN_MUNICIPALITY,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'in_town_fee' => 'required|numeric|min:0',
            'out_of_town_fee' => 'required|numeric|min:0',
        ]);

        $settings = DeliveryFeeSetting::current();
        $settings->update($validated);

        // No flash message here on purpose — the page already shows its own centered
        // confirmation via Inertia's `recentlySuccessful`, so adding a flash too just
        // fired the app-wide corner toast (FlashToaster) at the same time, doubling up.
        return back();
    }
}
