<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DeliveryBoySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test delivery boy
        User::create([
            'username' => 'deliveryboy1',
            'full_name' => 'Juan Dela Cruz',
            'email' => 'deliveryboy1@example.com',
            'password' => Hash::make('password123'),
            'contact_number' => '09123456789',
            'role' => 'delivery_boy',
            'is_active' => true,
        ]);

        // Create another test delivery boy
        User::create([
            'username' => 'deliveryboy2',
            'full_name' => 'Maria Santos',
            'email' => 'deliveryboy2@example.com',
            'password' => Hash::make('password123'),
            'contact_number' => '09987654321',
            'role' => 'delivery_boy',
            'is_active' => true,
        ]);

        $this->command->info('Delivery boys created successfully!');
    }
}
