<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class ActivateCustomerAccount extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "Activating customer account...\n\n";

        // Activate the customer account
        $customer = User::where('username', 'harris')->first();

        if ($customer) {
            $customer->update([
                'is_active' => true,
            ]);

            echo "✓ Customer account activated:\n";
            echo "  Username: {$customer->username}\n";
            echo "  Full Name: {$customer->full_name}\n";
            echo "  Email: {$customer->email}\n";
            echo "  Role: {$customer->role}\n";
            echo "  Is Active: " . ($customer->is_active ? 'Yes' : 'No') . "\n\n";
        } else {
            echo "⚠️  Customer account not found!\n";
        }

        // Also activate the super admin
        $superAdmin = User::where('username', 'harrismanabat0')->first();

        if ($superAdmin) {
            $superAdmin->update([
                'is_active' => true,
            ]);

            echo "✓ Super Admin account activated:\n";
            echo "  Username: {$superAdmin->username}\n";
            echo "  Full Name: {$superAdmin->full_name}\n";
            echo "  Email: {$superAdmin->email}\n";
            echo "  Role: {$superAdmin->role}\n";
            echo "  Is Active: " . ($superAdmin->is_active ? 'Yes' : 'No') . "\n\n";
        }

        echo "🎉 ACCOUNTS ACTIVATED!\n";
    }
}
