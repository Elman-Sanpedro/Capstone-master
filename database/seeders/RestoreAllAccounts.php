<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RestoreAllAccounts extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Dev-only recovery script: it resets every role to well-known
        // passwords (password / password123), so it must never run live.
        if (app()->isProduction()) {
            throw new \RuntimeException('RestoreAllAccounts resets accounts to default passwords and cannot run in production.');
        }

        $superAdminPassword = config('app.superadmin_password');

        if (blank($superAdminPassword)) {
            throw new \RuntimeException(
                'SUPERADMIN_PASSWORD is not set. Add it to .env (then php artisan config:clear) before restoring accounts.'
            );
        }

        echo "Restoring ALL accounts in the system...\n\n";

        // 1. SUPER ADMIN ACCOUNT
        $superAdmin = User::updateOrCreate(
            ['email' => 'harrism@gmail.com'],
            [
                'username' => 'harrismanabat0',
                'full_name' => 'Earl Harris',
                'email' => 'harrism@gmail.com',
                'password' => bcrypt($superAdminPassword),
                'role' => 'SuperAdmin',
                'is_active' => true,
                'is_approved' => true,
                'approved_at' => now(),
                'approved_by' => null,
                'contact_number' => '09772354804'
            ]
        );
        echo "✓ SUPER ADMIN restored:\n";
        echo "  Username: {$superAdmin->username}\n";
        echo "  Email: {$superAdmin->email}\n";
        echo "  Password: (SUPERADMIN_PASSWORD from .env)\n";
        echo "  Role: {$superAdmin->role}\n\n";

        // 2. ADMIN ACCOUNT
        $admin = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'username' => 'admin',
                'full_name' => 'System Administrator',
                'email' => 'admin@mejeckiceplant.com',
                'password' => bcrypt('password'),
                'role' => 'Admin',
                'is_active' => true,
                'contact_number' => '09123456789'
            ]
        );
        echo "✓ ADMIN restored:\n";
        echo "  Username: {$admin->username}\n";
        echo "  Email: {$admin->email}\n";
        echo "  Password: password\n";
        echo "  Role: {$admin->role}\n\n";

        // 3. DELIVERY BOY ACCOUNTS
        $deliveryBoy1 = User::updateOrCreate(
            ['username' => 'deliveryboy1'],
            [
                'username' => 'deliveryboy1',
                'full_name' => 'Juan Dela Cruz',
                'email' => 'deliveryboy1@example.com',
                'password' => Hash::make('password123'),
                'contact_number' => '09123456789',
                'role' => 'delivery_boy',
                'is_active' => true,
            ]
        );
        echo "✓ DELIVERY BOY 1 restored:\n";
        echo "  Username: {$deliveryBoy1->username}\n";
        echo "  Email: {$deliveryBoy1->email}\n";
        echo "  Password: password123\n";
        echo "  Role: {$deliveryBoy1->role}\n\n";

        $deliveryBoy2 = User::updateOrCreate(
            ['username' => 'deliveryboy2'],
            [
                'username' => 'deliveryboy2',
                'full_name' => 'Maria Santos',
                'email' => 'deliveryboy2@example.com',
                'password' => Hash::make('password123'),
                'contact_number' => '09987654321',
                'role' => 'delivery_boy',
                'is_active' => true,
            ]
        );
        echo "✓ DELIVERY BOY 2 restored:\n";
        echo "  Username: {$deliveryBoy2->username}\n";
        echo "  Email: {$deliveryBoy2->email}\n";
        echo "  Password: password123\n";
        echo "  Role: {$deliveryBoy2->role}\n\n";

        // 4. CUSTOMER ACCOUNT (from your test account)
        $customer = User::updateOrCreate(
            ['email' => 'harrismanabat3@gmail.com'],
            [
                'username' => 'customer_harris',
                'full_name' => 'Harris Manabat',
                'email' => 'harrismanabat3@gmail.com',
                'password' => Hash::make('password123'),
                'role' => 'Customer',
                'is_active' => true,
                'contact_number' => '09772354804'
            ]
        );
        echo "✓ CUSTOMER restored:\n";
        echo "  Username: {$customer->username}\n";
        echo "  Email: {$customer->email}\n";
        echo "  Password: password123\n";
        echo "  Role: {$customer->role}\n\n";

        echo "🎉 ALL ACCOUNTS HAVE BEEN SUCCESSFULLY RESTORED!\n";
        echo "📋 SUMMARY OF ACCOUNTS:\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "1. Super Admin: harrismanabat0 (harrism@gmail.com)\n";
        echo "2. Admin: admin (admin@mejeckiceplant.com)\n";
        echo "3. Delivery Boy 1: deliveryboy1 (deliveryboy1@example.com)\n";
        echo "4. Delivery Boy 2: deliveryboy2 (deliveryboy2@example.com)\n";
        echo "5. Customer: customer_harris (harrismanabat3@gmail.com)\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    }
}
