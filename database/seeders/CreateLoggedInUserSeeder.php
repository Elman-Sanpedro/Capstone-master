<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class CreateLoggedInUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = config('app.superadmin_password');

        if (blank($password)) {
            throw new \RuntimeException(
                'SUPERADMIN_PASSWORD is not set. Add it to .env (then php artisan config:clear) before seeding the SuperAdmin account.'
            );
        }

        User::updateOrCreate(
            ['email' => 'harrism@gmail.com'],
            [
                'username' => 'harrismanabat0',
                'full_name' => 'Earl Harris',
                'email' => 'harrism@gmail.com',
                'password' => bcrypt($password),
                'role' => 'SuperAdmin',
                'is_active' => true,
                'is_approved' => true,
                'approved_at' => now(),
                'approved_by' => null, // Self-approved as first admin
                'contact_number' => '09772354804'
            ]
        );
    }
}
